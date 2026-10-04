import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SwgaGame } from "../components/swga-game";
import { buildRankedSwgaSubmission, type RankedSubmissionAttempt, type SwgaGameMode } from "../logic/ranked-client";
import { createInitialRunState, submitGuess, type RunState } from "../logic/swga";
import type { PersonalBestSnapshot, PersonalBestRefresh } from "../logic/personal-best";
import styles from "../components/swga-game.module.css";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// Follow the existing SSR presentation pattern: seed state, render the real view.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useState: vi.fn(actual.useState) };
});
afterEach(() => vi.clearAllMocks());

function renderResult({
  runState = createInitialRunState("a"),
  gameMode = "timed",
  started = true,
  timedOut = false,
  status = "saving",
  personalBest,
  previousBest = null,
  bestRefresh = null,
}: {
  runState?: RunState;
  gameMode?: SwgaGameMode;
  started?: boolean;
  timedOut?: boolean;
  status?: RankedSubmissionAttempt["status"];
  personalBest?: PersonalBestSnapshot;
  previousBest?: PersonalBestSnapshot | null;
  bestRefresh?: PersonalBestRefresh | null;
} = {}) {
  const payload = buildRankedSwgaSubmission({
    gameMode, runState, timedOut, timedGameplayStarted: started,
    submissionId: started ? "presentation-test" : null,
  });
  const state = [
    runState, "", "", "info", gameMode, started ? 60_000 : null,
    timedOut ? 0 : 60_000, timedOut, started,
    started ? "presentation-test" : null,
    payload ? { payload, status } : null,
    previousBest, bestRefresh,
  ];
  for (const value of state) vi.mocked(useState).mockReturnValueOnce([value, vi.fn()]);
  return renderToStaticMarkup(<SwgaGame personalBest={personalBest} />);
}

function lostRun() {
  let run = createInitialRunState("a");
  const guesses = ["b", "c", "d", "e", "f", "g"];
  for (const guess of guesses) run = submitGuess(run, guess, guesses);
  expect(run.status).toBe("lost");
  return run;
}

function completedRun() {
  let run = createInitialRunState("a");
  for (let length = 1; length <= 20; length++) {
    const answer = "a".repeat(length);
    run = submitGuess(run, answer, [answer], "a".repeat(length + 1));
  }
  expect(run.status).toBe("completed");
  return run;
}

describe("SWGA results leaderboard action", () => {
  it("does not appear in active Untimed gameplay", () => {
    const markup = renderResult({ gameMode: "untimed" });
    expect(markup).toContain('aria-label="On-screen keyboard"');
    expect(markup).not.toContain("View leaderboard");
  });

  it.each(["lost", "completed"])("does not appear in Untimed %s results", (outcome) => {
    const markup = renderResult({ gameMode: "untimed", runState: outcome === "lost" ? lostRun() : completedRun() });
    expect(markup).toContain("Play Again</button>");
    expect(markup).not.toContain("View leaderboard");
    expect(markup).not.toContain("Ranked result");
  });

  it.each([false, true])("does not appear during ranked gameplay (started: %s)", (started) => {
    expect(renderResult({ started })).not.toContain("View leaderboard");
  });

  it("requires a started ranked run even for terminal state", () => {
    expect(renderResult({ started: false, runState: lostRun() })).not.toContain("View leaderboard");
  });

  it.each(["timeout", "lost", "completed"])("provides exactly one navigation link and Play Again after ranked %s", (outcome) => {
    const markup = renderResult({
      timedOut: outcome === "timeout",
      runState: outcome === "lost" ? lostRun() : outcome === "completed" ? completedRun() : undefined,
    });
    expect(markup.match(/<a[^>]*href="\/leaderboard"[^>]*>View leaderboard<\/a>/g)).toHaveLength(1);
    expect(markup.match(/View leaderboard/g)).toHaveLength(1);
    expect(markup).toContain("Play Again</button>");
  });

  it.each([
    ["saving", "Saving ranked run…"],
    ["saved", "Ranked run saved."],
    ["authentication-required", "sign-in is required."],
    ["profile-required", "player profile is required."],
    ["conflict", "earlier submission."],
    ["retryable-error", "save this ranked run."],
  ] as const)("preserves %s status independently of navigation", (status, message) => {
    const markup = renderResult({ timedOut: true, status });
    expect(markup).toContain(message);
    expect(markup).toContain("View leaderboard</a>");
    expect(markup.includes("Ranked run saved.")).toBe(status === "saved");
    expect(markup.includes("Retry</button>")).toBe(status === "retryable-error");
    if (status === "authentication-required") expect(markup).toContain('href="/login">Sign in</a>');
    if (status === "profile-required") expect(markup).toContain('href="/profile">Set up your profile</a>');
  });
});

const knownBest: PersonalBestSnapshot = { revision: "read-1", userId: "player", result: { status: "known", score: 5 } };

describe("SWGA personal best presentation", () => {
  it("shows the existing best on ranked selection before gameplay starts", () => {
    const markup = renderResult({ personalBest: knownBest, started: false });
    expect(markup).toContain("Personal best: <strong>5</strong>");
    expect(markup).not.toContain(styles.bestExceeded);
  });
  it("hides ranked best and milestones in Untimed", () => {
    const markup = renderResult({ personalBest: knownBest, previousBest: knownBest, gameMode: "untimed", runState: { ...createInitialRunState("a"), totalScore: 10 } });
    expect(markup).not.toContain("personal best");
    expect(markup).not.toContain(styles.bestExceeded);
  });
  it.each([0, 5, 10])("compares the total score %s strictly against the frozen previous best", (score) => {
    const markup = renderResult({ personalBest: knownBest, previousBest: knownBest, runState: { ...createInitialRunState("a"), totalScore: score } });
    expect(markup).toContain("Previous personal best: <strong>5</strong>");
    expect(markup.includes(styles.bestExceeded)).toBe(score > 5);
    expect(markup.includes("This run is not saved yet.")).toBe(score > 5);
    expect(markup).not.toContain("Saved personal best");
  });
  it.each(["signed-out", "no-history", "unavailable"] as const)("explains %s without inventing zero or celebrating", (status) => {
    const personalBest: PersonalBestSnapshot = { ...knownBest, result: { status } };
    const markup = renderResult({ personalBest, previousBest: personalBest, runState: { ...createInitialRunState("a"), totalScore: 10 } });
    expect(markup).toContain(status === "signed-out" ? "Sign in to track" : status === "no-history" ? "No ranked runs recorded" : "Personal best unavailable");
    expect(markup).not.toContain(styles.bestExceeded);
  });
  it.each(["saving", "authentication-required", "profile-required", "conflict", "retryable-error"] as const)("never calls a %s result a saved best", (status) => {
    const markup = renderResult({ personalBest: knownBest, previousBest: knownBest, timedOut: true, status, runState: { ...createInitialRunState("a"), totalScore: 10 } });
    expect(markup).toContain("This run is not saved yet.");
    expect(markup).not.toContain("Saved personal best");
    expect(markup).toContain("View leaderboard</a>");
    expect(markup).toContain("Play Again</button>");
  });
  it("waits for a fresh aggregate after submission confirmation", () => {
    const markup = renderResult({ personalBest: knownBest, previousBest: knownBest, timedOut: true, status: "saved", bestRefresh: { revision: "read-1", userId: "player", minimumScore: 10 } });
    expect(markup).toContain("Refreshing personal best…");
    expect(markup).not.toContain("Saved personal best");
  });
  it("shows the refreshed saved best, including a higher score from elsewhere", () => {
    const markup = renderResult({ personalBest: { ...knownBest, revision: "read-2", result: { status: "known", score: 40 } }, previousBest: knownBest, timedOut: true, status: "saved", bestRefresh: { revision: "read-1", userId: "player", minimumScore: 10 }, runState: { ...createInitialRunState("a"), totalScore: 10 } });
    expect(markup).toContain("Saved personal best: <strong>40</strong>");
    expect(markup).toContain("Previous best exceeded during this run.");
    expect(markup).not.toContain("not saved yet");
  });
});
