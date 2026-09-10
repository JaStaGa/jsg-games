import { describe, expect, it, vi } from "vitest";
import {
  beginRankedSubmission, buildRankedCharacterSubmission, ensureRankedSubmissionId,
  settleRankedSubmission, submitRankedCharacterRun,
} from "../logic/ranked-client";
import { createCharacterGuessingEngine, onTimeout } from "../logic/session";
import { expeditionCrew } from "../data/expedition-crew";
import type { RankedCharacterSubmission } from "../logic/ranked-submission";

const ID = "123e4567-e89b-12d3-a456-426614174000";
const NEXT_ID = "223e4567-e89b-12d3-a456-426614174000";
const engine = createCharacterGuessingEngine(expeditionCrew, () => 0);
const start = () => engine.startRound(engine.startSession(0), 0);
const payload: RankedCharacterSubmission = {
  submissionId: ID, themeId: "expedition-crew", score: 5, outcome: "timed-out", roundsPlayed: 2, solved: 1,
};

describe("ranked Character Guessing client", () => {
  it("derives the exact timeout summary from engine rounds", () => {
    let session = engine.submitGuess(start(), "Aven Tallow", 1);
    session = onTimeout(engine.startRound(session, 2), 60_000);
    expect(buildRankedCharacterSubmission({ session, themeId: "expedition-crew", submissionId: ID })).toEqual(payload);
  });

  it("derives exhaustion including unsuccessful rounds", () => {
    let session = start();
    for (const [index, character] of expeditionCrew.characters.entries()) {
      if (index === 0) {
        for (let guess = 0; guess < 5; guess++) session = engine.submitGuess(session, "Unknown", 1);
      } else session = engine.submitGuess(session, character.name, 1);
      session = engine.startRound(session, 2);
    }
    expect(buildRankedCharacterSubmission({ session, themeId: "expedition-crew", submissionId: ID })).toEqual({
      submissionId: ID, themeId: "expedition-crew", score: 115, outcome: "exhausted", roundsPlayed: 24, solved: 23,
    });
  });

  it("does not submit playing sessions, absent opt-in, absent UUID, or empty runs", () => {
    const session = onTimeout(start(), 60_000);
    expect(buildRankedCharacterSubmission({ session: start(), themeId: "expedition-crew", submissionId: ID })).toBeNull();
    expect(buildRankedCharacterSubmission({ session, themeId: undefined, submissionId: ID })).toBeNull();
    expect(buildRankedCharacterSubmission({ session, themeId: "expedition-crew", submissionId: null })).toBeNull();
    expect(buildRankedCharacterSubmission({ session: { ...session, rounds: [] }, themeId: "expedition-crew", submissionId: ID })).toBeNull();
  });

  it("uses explicit ranked metadata rather than inferring it from the session theme ID", () => {
    const session = { ...onTimeout(start(), 60_000), themeId: "custom-config-id" };
    expect(buildRankedCharacterSubmission({ session, themeId: "copperlight-city", submissionId: ID })?.themeId).toBe("copperlight-city");
  });

  it("keeps one UUID until a fresh run and creates none for unranked play", () => {
    const factory = vi.fn().mockReturnValueOnce(ID).mockReturnValueOnce(NEXT_ID);
    expect(ensureRankedSubmissionId(undefined, null, factory)).toBeNull();
    expect(factory).not.toHaveBeenCalled();
    const first = ensureRankedSubmissionId("expedition-crew", null, factory);
    expect(ensureRankedSubmissionId("expedition-crew", first, factory)).toBe(ID);
    expect(ensureRankedSubmissionId("expedition-crew", null, factory)).toBe(NEXT_ID);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("posts only the six approved fields to the exact endpoint with same-origin credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true, status: "created" }, { status: 201 }));
    await expect(submitRankedCharacterRun({ ...payload, userId: "unsafe", gameSlug: "unsafe", guesses: [] } as RankedCharacterSubmission, fetcher)).resolves.toBe("saved");
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/games/character-guessing/runs", {
      method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
  });

  it.each([
    [201, { ok: true, status: "created" }, "saved"],
    [200, { ok: true, status: "already_recorded" }, "saved"],
    [401, { error: "private" }, "authentication-required"],
    [403, { error: "private" }, "profile-required"],
    [409, { error: "private" }, "conflict"],
    [503, { error: "private" }, "retryable-error"],
    [400, { error: "private" }, "retryable-error"],
    [202, { ok: true, status: "created" }, "retryable-error"],
    [200, { ok: true, status: "created" }, "retryable-error"],
    [201, { ok: true, status: "already_recorded" }, "retryable-error"],
    [201, { ok: false, status: "created" }, "retryable-error"],
    [201, { status: "created" }, "retryable-error"],
    [201, null, "retryable-error"],
    [201, [], "retryable-error"],
  ])("normalizes HTTP %s with body %j", async (status, body, expected) => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(body, { status: status as number }));
    await expect(submitRankedCharacterRun(payload, fetcher)).resolves.toBe(expected);
  });

  it("handles malformed JSON and network errors without leaking details", async () => {
    await expect(submitRankedCharacterRun(payload, vi.fn().mockResolvedValue(new Response("not json", { status: 201 })))).resolves.toBe("retryable-error");
    await expect(submitRankedCharacterRun(payload, vi.fn().mockRejectedValue(new Error("private")))).resolves.toBe("retryable-error");
  });

  it("retains the identical payload and UUID for retry", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(Response.json({ ok: true, status: "already_recorded" }, { status: 200 }));
    const attempt = beginRankedSubmission(payload);
    const failed = settleRankedSubmission(attempt, ID, await submitRankedCharacterRun(attempt.payload, fetcher))!;
    expect(failed.status).toBe("retryable-error");
    expect(failed.payload).toBe(payload);
    await expect(submitRankedCharacterRun(failed.payload, fetcher)).resolves.toBe("saved");
    expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]);
  });

  it("ignores a deferred prior-run response while the new run is playing or saving", async () => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
    const pending = submitRankedCharacterRun(payload, fetcher);
    const newer = beginRankedSubmission({ ...payload, submissionId: NEXT_ID });
    finish(Response.json({ ok: true, status: "created" }, { status: 201 }));
    const result = await pending;
    expect(settleRankedSubmission(null, ID, result)).toBeNull();
    expect(settleRankedSubmission(newer, ID, result)).toBe(newer);
    expect(settleRankedSubmission(newer, NEXT_ID, "saved")).toEqual({ ...newer, status: "saved" });
  });
});
