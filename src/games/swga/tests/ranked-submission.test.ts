import { describe, expect, it } from "vitest";
import { validateRankedSwgaSubmission } from "../logic/ranked-submission";

const SUBMISSION_ID = "123e4567-e89b-12d3-a456-426614174000";

function submission(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: SUBMISSION_ID,
    score: 45,
    outcome: "lost",
    highestWordLengthReached: 10,
    ...overrides,
  };
}

describe("ranked SWGA submission validation", () => {
  it("accepts a plausible loss", () => {
    expect(validateRankedSwgaSubmission(submission())).toEqual({
      success: true,
      payload: submission(),
    });
  });

  it("accepts a plausible timeout", () => {
    const payload = submission({
      score: 95,
      outcome: "timed-out",
      highestWordLengthReached: 20,
    });

    expect(validateRankedSwgaSubmission(payload)).toEqual({
      success: true,
      payload,
    });
  });

  it("accepts a plausible completion", () => {
    const payload = submission({
      score: 100,
      outcome: "completed",
      highestWordLengthReached: 20,
    });

    expect(validateRankedSwgaSubmission(payload)).toEqual({
      success: true,
      payload,
    });
  });

  it("rejects an invalid UUID", () => {
    expect(
      validateRankedSwgaSubmission(submission({ submissionId: "not-a-uuid" })),
    ).toEqual({ success: false });
  });

  it("rejects a fractional score", () => {
    expect(validateRankedSwgaSubmission(submission({ score: 4.5 }))).toEqual({
      success: false,
    });
  });

  it("rejects a negative score", () => {
    expect(validateRankedSwgaSubmission(submission({ score: -1 }))).toEqual({
      success: false,
    });
  });

  it("rejects a score above the absolute maximum", () => {
    expect(validateRankedSwgaSubmission(submission({ score: 101 }))).toEqual({
      success: false,
    });
  });

  it("rejects a highest word length below one", () => {
    expect(
      validateRankedSwgaSubmission(
        submission({ highestWordLengthReached: 0, score: 0 }),
      ),
    ).toEqual({ success: false });
  });

  it("rejects a highest word length above twenty", () => {
    expect(
      validateRankedSwgaSubmission(
        submission({ highestWordLengthReached: 21 }),
      ),
    ).toEqual({ success: false });
  });

  it("rejects an unknown outcome", () => {
    expect(
      validateRankedSwgaSubmission(submission({ outcome: "quit" })),
    ).toEqual({ success: false });
  });

  it("rejects a completion below word length twenty", () => {
    expect(
      validateRankedSwgaSubmission(
        submission({
          score: 90,
          outcome: "completed",
          highestWordLengthReached: 19,
        }),
      ),
    ).toEqual({ success: false });
  });

  it.each([
    { outcome: "lost", highestWordLengthReached: 1, score: 1 },
    { outcome: "timed-out", highestWordLengthReached: 10, score: 46 },
    { outcome: "lost", highestWordLengthReached: 20, score: 96 },
  ])(
    "rejects $outcome score $score above the reached-length maximum",
    (payload) => {
      expect(validateRankedSwgaSubmission(submission(payload))).toEqual({
        success: false,
      });
    },
  );

  it.each([
    { outcome: "lost", highestWordLengthReached: 1, score: 0 },
    { outcome: "timed-out", highestWordLengthReached: 2, score: 5 },
    { outcome: "lost", highestWordLengthReached: 20, score: 95 },
    { outcome: "completed", highestWordLengthReached: 20, score: 0 },
  ])("accepts the $outcome boundary values", (payload) => {
    expect(validateRankedSwgaSubmission(submission(payload)).success).toBe(
      true,
    );
  });

  it("rejects browser-supplied ownership and game fields", () => {
    expect(
      validateRankedSwgaSubmission(
        submission({ userId: "attacker", gameSlug: "other-game" }),
      ),
    ).toEqual({ success: false });
  });
});
