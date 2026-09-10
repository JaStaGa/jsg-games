import { copperlightCity } from "../data/copperlight-city";
import { expeditionCrew } from "../data/expedition-crew";

/** Explicit competitive allowlist, independent of the site discovery catalog. */
export const RANKED_CHARACTER_THEMES = {
  "expedition-crew": {
    gameSlug: "character-guessing-expedition-crew",
    characterCount: expeditionCrew.characters.length,
  },
  "copperlight-city": {
    gameSlug: "character-guessing-copperlight-city",
    characterCount: copperlightCity.characters.length,
  },
} as const;

export type RankedCharacterThemeId = keyof typeof RANKED_CHARACTER_THEMES;

export interface RankedCharacterSubmission {
  submissionId: string;
  themeId: RankedCharacterThemeId;
  score: number;
  outcome: "timed-out" | "exhausted";
  roundsPlayed: number;
  solved: number;
}

const PAYLOAD_KEYS = [
  "submissionId", "themeId", "score", "outcome", "roundsPlayed", "solved",
] as const;

// Same UUID syntax policy as ranked SWGA; no additional version restriction.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isExactPayloadObject(
  input: unknown,
): input is Record<(typeof PAYLOAD_KEYS)[number], unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input)
    && Object.keys(input).length === PAYLOAD_KEYS.length
    && PAYLOAD_KEYS.every((key) => Object.hasOwn(input, key));
}

function isRankedThemeId(input: unknown): input is RankedCharacterThemeId {
  return typeof input === "string" && Object.hasOwn(RANKED_CHARACTER_THEMES, input);
}

export function validateRankedCharacterSubmission(input: unknown):
  | { success: true; payload: RankedCharacterSubmission }
  | { success: false } {
  if (!isExactPayloadObject(input)) return { success: false };
  const { submissionId, themeId, score, outcome, roundsPlayed, solved } = input;
  if (
    typeof submissionId !== "string" || !UUID_PATTERN.test(submissionId)
    || !isRankedThemeId(themeId)
    || typeof score !== "number" || !Number.isInteger(score) || score < 0
    || (outcome !== "timed-out" && outcome !== "exhausted")
    || typeof roundsPlayed !== "number" || !Number.isInteger(roundsPlayed)
    || roundsPlayed < 1 || roundsPlayed > RANKED_CHARACTER_THEMES[themeId].characterCount
    || typeof solved !== "number" || !Number.isInteger(solved)
    || solved < 0 || solved > roundsPlayed
    || score < solved || score > 5 * solved
  ) return { success: false };

  if (outcome === "exhausted" && roundsPlayed !== RANKED_CHARACTER_THEMES[themeId].characterCount) {
    return { success: false };
  }

  return {
    success: true,
    payload: { submissionId, themeId, score, outcome, roundsPlayed, solved },
  };
}
