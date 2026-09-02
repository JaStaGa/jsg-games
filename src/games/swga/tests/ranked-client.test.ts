import { describe, expect, it, vi } from "vitest";
import {
  beginRankedSubmission,
  buildRankedSwgaSubmission,
  ensureRankedSubmissionId,
  RANKED_SWGA_RUNS_ENDPOINT,
  settleRankedSubmission,
  submitRankedSwgaRun,
} from "../logic/ranked-client";
import type { RankedSwgaSubmission } from "../logic/ranked-submission";

const SUBMISSION_ID = "123e4567-e89b-12d3-a456-426614174000";
const NEXT_SUBMISSION_ID = "223e4567-e89b-42d3-a456-426614174001";
const RUN_STATE = {
  status: "lost" as const,
  totalScore: 37,
  highestWordLengthReached: 9,
};
const PAYLOAD: RankedSwgaSubmission = {
  submissionId: SUBMISSION_ID,
  score: 37,
  outcome: "lost",
  highestWordLengthReached: 9,
};

function candidate(
  overrides: Partial<Parameters<typeof buildRankedSwgaSubmission>[0]> = {},
) {
  return {
    gameMode: "timed" as const,
    timedGameplayStarted: true,
    timedOut: false,
    submissionId: SUBMISSION_ID,
    runState: RUN_STATE,
    ...overrides,
  };
}

function controlledResponse(
  status: number,
  body: Record<string, unknown> = {},
) {
  return Response.json(body, { status });
}

describe("ranked SWGA terminal payload mapping", () => {
  it("maps a timed loss with the exact score, length, and stable UUID", () => {
    expect(buildRankedSwgaSubmission(candidate())).toEqual(PAYLOAD);
  });

  it("maps a timed completion", () => {
    expect(
      buildRankedSwgaSubmission(
        candidate({
          runState: {
            status: "completed",
            totalScore: 88,
            highestWordLengthReached: 20,
          },
        }),
      ),
    ).toEqual({
      submissionId: SUBMISSION_ID,
      score: 88,
      outcome: "completed",
      highestWordLengthReached: 20,
    });
  });

  it("maps timer expiration ahead of the still-playing run state", () => {
    expect(
      buildRankedSwgaSubmission(
        candidate({
          timedOut: true,
          runState: {
            status: "playing",
            totalScore: 42,
            highestWordLengthReached: 11,
          },
        }),
      ),
    ).toEqual({
      submissionId: SUBMISSION_ID,
      score: 42,
      outcome: "timed-out",
      highestWordLengthReached: 11,
    });
  });

  it("does not map a non-terminal run", () => {
    expect(
      buildRankedSwgaSubmission(
        candidate({ runState: { ...RUN_STATE, status: "playing" } }),
      ),
    ).toBeNull();
  });

  it("does not map an untimed terminal run", () => {
    expect(
      buildRankedSwgaSubmission(candidate({ gameMode: "untimed" })),
    ).toBeNull();
  });

  it("requires Timed gameplay to have actually started", () => {
    expect(
      buildRankedSwgaSubmission(
        candidate({ timedGameplayStarted: false, submissionId: null }),
      ),
    ).toBeNull();
  });
});

describe("ranked SWGA browser submission", () => {
  it("posts exactly the approved four fields with same-origin credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      controlledResponse(201, { ok: true, status: "created" }),
    );

    await expect(
      submitRankedSwgaRun(
        { ...PAYLOAD, ignoredByHelper: "unsafe" } as RankedSwgaSubmission,
        fetcher,
      ),
    ).resolves.toBe("saved");

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(RANKED_SWGA_RUNS_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(PAYLOAD),
    });
  });

  it("normalizes created and idempotent success responses as saved", async () => {
    const created = vi
      .fn()
      .mockResolvedValue(controlledResponse(201, { status: "created" }));
    const repeated = vi.fn().mockResolvedValue(
      controlledResponse(200, { status: "already_recorded" }),
    );

    await expect(submitRankedSwgaRun(PAYLOAD, created)).resolves.toBe("saved");
    await expect(submitRankedSwgaRun(PAYLOAD, repeated)).resolves.toBe(
      "saved",
    );
  });

  it.each([
    [401, "authentication-required"],
    [403, "profile-required"],
    [409, "conflict"],
  ] as const)("normalizes HTTP %i", async (status, expected) => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(controlledResponse(status, { error: "controlled" }));

    await expect(submitRankedSwgaRun(PAYLOAD, fetcher)).resolves.toBe(
      expected,
    );
  });

  it("normalizes 5xx responses without leaking raw server details", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      controlledResponse(503, {
        error: "service_unavailable",
        raw: "sensitive database detail",
      }),
    );

    const result = await submitRankedSwgaRun(PAYLOAD, fetcher);

    expect(result).toBe("retryable-error");
    expect(JSON.stringify(result)).not.toContain("sensitive database detail");
  });

  it("normalizes thrown network failures as retryable", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("private network detail"));

    await expect(submitRankedSwgaRun(PAYLOAD, fetcher)).resolves.toBe(
      "retryable-error",
    );
  });
});

describe("ranked SWGA run identity and attempt state", () => {
  it("reuses one UUID for a run and creates a different one after reset", () => {
    const createId = vi
      .fn()
      .mockReturnValueOnce(SUBMISSION_ID)
      .mockReturnValueOnce(NEXT_SUBMISSION_ID);
    const firstRunId = ensureRankedSubmissionId("timed", null, createId);
    const retryId = ensureRankedSubmissionId("timed", firstRunId, createId);
    const restartedRunId = ensureRankedSubmissionId("timed", null, createId);

    expect(firstRunId).toBe(SUBMISSION_ID);
    expect(retryId).toBe(SUBMISSION_ID);
    expect(restartedRunId).toBe(NEXT_SUBMISSION_ID);
    expect(createId).toHaveBeenCalledTimes(2);
  });

  it("does not create a UUID for Untimed play", () => {
    const createId = vi.fn(() => SUBMISSION_ID);

    expect(ensureRankedSubmissionId("untimed", null, createId)).toBeNull();
    expect(createId).not.toHaveBeenCalled();
  });

  it("keeps the same terminal payload available for retry", () => {
    const retryable = settleRankedSubmission(
      beginRankedSubmission(PAYLOAD),
      SUBMISSION_ID,
      "retryable-error",
    );

    expect(retryable).toEqual({ payload: PAYLOAD, status: "retryable-error" });
  });

  it("ignores an old in-flight result after a newer run takes ownership", () => {
    const newerPayload = { ...PAYLOAD, submissionId: NEXT_SUBMISSION_ID };
    const newerAttempt = beginRankedSubmission(newerPayload);

    expect(
      settleRankedSubmission(newerAttempt, SUBMISSION_ID, "saved"),
    ).toBe(newerAttempt);
    expect(
      settleRankedSubmission(newerAttempt, NEXT_SUBMISSION_ID, "saved"),
    ).toEqual({ payload: newerPayload, status: "saved" });
  });
});
