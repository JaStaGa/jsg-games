export const RANKED_SWGA_OUTCOMES = [
  "lost",
  "completed",
  "timed-out",
] as const;

export type RankedSwgaOutcome = (typeof RANKED_SWGA_OUTCOMES)[number];

export interface RankedSwgaSubmission {
  submissionId: string;
  score: number;
  outcome: RankedSwgaOutcome;
  highestWordLengthReached: number;
}

export type RankedSwgaSubmissionValidation =
  | { success: true; payload: RankedSwgaSubmission }
  | { success: false };

const PAYLOAD_KEYS = [
  "submissionId",
  "score",
  "outcome",
  "highestWordLengthReached",
] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isExactPayloadObject(
  input: unknown,
): input is Record<(typeof PAYLOAD_KEYS)[number], unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const keys = Object.keys(input);

  return (
    keys.length === PAYLOAD_KEYS.length &&
    PAYLOAD_KEYS.every((key) => Object.hasOwn(input, key))
  );
}

function isRankedSwgaOutcome(input: unknown): input is RankedSwgaOutcome {
  return RANKED_SWGA_OUTCOMES.some((outcome) => outcome === input);
}

export function validateRankedSwgaSubmission(
  input: unknown,
): RankedSwgaSubmissionValidation {
  if (!isExactPayloadObject(input)) {
    return { success: false };
  }

  const { submissionId, score, outcome, highestWordLengthReached } = input;

  if (
    typeof submissionId !== "string" ||
    !UUID_PATTERN.test(submissionId) ||
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    !isRankedSwgaOutcome(outcome) ||
    typeof highestWordLengthReached !== "number" ||
    !Number.isInteger(highestWordLengthReached) ||
    highestWordLengthReached < 1 ||
    highestWordLengthReached > 20
  ) {
    return { success: false };
  }

  if (outcome === "completed") {
    if (highestWordLengthReached !== 20) {
      return { success: false };
    }
  } else if (score > 5 * (highestWordLengthReached - 1)) {
    return { success: false };
  }

  return {
    success: true,
    payload: { submissionId, score, outcome, highestWordLengthReached },
  };
}
