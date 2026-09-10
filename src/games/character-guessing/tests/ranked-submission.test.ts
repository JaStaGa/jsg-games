import { describe, expect, it } from "vitest";
import { copperlightCity } from "../data/copperlight-city";
import { expeditionCrew } from "../data/expedition-crew";
import { validateRankedCharacterSubmission } from "../logic/ranked-submission";

const SUBMISSION_ID = "123e4567-e89b-12d3-a456-426614174000";
const themes = [expeditionCrew, copperlightCity];

describe.each(themes)("ranked $id submission validation", (theme) => {
  const count = theme.characters.length;
  const submission = (overrides: Record<string, unknown> = {}) => ({
    submissionId: SUBMISSION_ID, themeId: theme.id, score: 10,
    outcome: "timed-out", roundsPlayed: 3, solved: 2, ...overrides,
  });

  it.each([
    { roundsPlayed: 1, solved: 0, score: 0 },
    { roundsPlayed: 1, solved: 1, score: 1 },
    { roundsPlayed: 1, solved: 1, score: 5 },
    { roundsPlayed: count, solved: count, score: 5 * count },
    { outcome: "exhausted", roundsPlayed: count, solved: 0, score: 0 },
    { outcome: "exhausted", roundsPlayed: count, solved: count, score: count },
    { outcome: "exhausted", roundsPlayed: count, solved: count, score: 5 * count },
    { submissionId: SUBMISSION_ID.toUpperCase() },
  ])("accepts terminal boundary %j", (overrides) => {
    const payload = submission(overrides);
    expect(validateRankedCharacterSubmission(payload)).toEqual({ success: true, payload });
  });

  it.each([
    { themeId: "unknown" }, { themeId: "character-guessing" },
    { themeId: "character-guessing-expedition-crew" },
    { themeId: "__proto__" }, { themeId: "constructor" }, { themeId: null },
    { submissionId: "bad-uuid" }, { submissionId: ` ${SUBMISSION_ID}` }, { submissionId: 123 },
    { score: -1 }, { score: 1.5 }, { score: NaN }, { score: Infinity }, { score: "10" },
    { roundsPlayed: 0 }, { roundsPlayed: count + 1 }, { roundsPlayed: 2.5 },
    { roundsPlayed: "3" }, { roundsPlayed: NaN },
    { solved: -1 }, { solved: 4 }, { solved: 1.5 }, { solved: "2" }, { solved: NaN },
    { score: 1 }, { score: 11 }, { solved: 0, score: 1 },
    { outcome: "exhausted", roundsPlayed: count - 1 },
    { outcome: "playing" }, { outcome: "correct" }, { outcome: "completed" },
  ])("rejects invalid summary %j", (overrides) => {
    expect(validateRankedCharacterSubmission(submission(overrides))).toEqual({ success: false });
  });

  it.each(["user_id", "userId", "game_id", "gameId", "gameSlug", "slug", "completed_at", "completedAt", "extra"])(
    "rejects browser-controlled extra field %s", (key) => {
      expect(validateRankedCharacterSubmission(submission({ [key]: "untrusted" }))).toEqual({ success: false });
    },
  );

  it.each(["submissionId", "themeId", "score", "outcome", "roundsPlayed", "solved"])(
    "requires own field %s", (key) => {
      const payload: Record<string, unknown> = submission();
      delete payload[key];
      expect(validateRankedCharacterSubmission(payload)).toEqual({ success: false });
    },
  );

  it.each([null, undefined, [], "payload", 42, true])("rejects non-object %j", (payload) => {
    expect(validateRankedCharacterSubmission(payload)).toEqual({ success: false });
  });
});
