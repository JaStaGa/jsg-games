import type { RankedSwgaSubmission } from "./ranked-submission";
import type { RunState } from "./swga";

export const RANKED_SWGA_RUNS_ENDPOINT = "/api/games/swga/runs";

export type SwgaGameMode = "untimed" | "timed";

export type RankedSubmissionResult =
  | "saved"
  | "authentication-required"
  | "profile-required"
  | "conflict"
  | "retryable-error";

export interface RankedSubmissionAttempt {
  payload: RankedSwgaSubmission;
  status: "saving" | RankedSubmissionResult;
}

interface RankedSubmissionCandidate {
  gameMode: SwgaGameMode;
  timedGameplayStarted: boolean;
  timedOut: boolean;
  submissionId: string | null;
  runState: Pick<
    RunState,
    "status" | "totalScore" | "highestWordLengthReached"
  >;
}

type SubmissionIdFactory = () => string;

export function ensureRankedSubmissionId(
  gameMode: SwgaGameMode,
  existingSubmissionId: string | null,
  createSubmissionId: SubmissionIdFactory = () => crypto.randomUUID(),
): string | null {
  if (gameMode !== "timed") {
    return null;
  }

  return existingSubmissionId ?? createSubmissionId();
}

export function buildRankedSwgaSubmission({
  gameMode,
  timedGameplayStarted,
  timedOut,
  submissionId,
  runState,
}: RankedSubmissionCandidate): RankedSwgaSubmission | null {
  if (
    gameMode !== "timed" ||
    !timedGameplayStarted ||
    submissionId === null
  ) {
    return null;
  }

  let outcome: RankedSwgaSubmission["outcome"];

  if (timedOut) {
    outcome = "timed-out";
  } else if (runState.status === "lost") {
    outcome = "lost";
  } else if (runState.status === "completed") {
    outcome = "completed";
  } else {
    return null;
  }

  return {
    submissionId,
    score: runState.totalScore,
    outcome,
    highestWordLengthReached: runState.highestWordLengthReached,
  };
}

export function beginRankedSubmission(
  payload: RankedSwgaSubmission,
): RankedSubmissionAttempt {
  return { payload, status: "saving" };
}

export function settleRankedSubmission(
  currentAttempt: RankedSubmissionAttempt | null,
  submissionId: string,
  result: RankedSubmissionResult,
): RankedSubmissionAttempt | null {
  if (
    currentAttempt === null ||
    currentAttempt.payload.submissionId !== submissionId
  ) {
    return currentAttempt;
  }

  return { ...currentAttempt, status: result };
}

async function isControlledSavedResponse(response: Response) {
  if (response.status !== 200 && response.status !== 201) {
    return false;
  }

  try {
    const body: unknown = await response.json();

    if (typeof body !== "object" || body === null || !("status" in body)) {
      return false;
    }

    return (
      (response.status === 201 && body.status === "created") ||
      (response.status === 200 && body.status === "already_recorded")
    );
  } catch {
    return false;
  }
}

export async function submitRankedSwgaRun(
  payload: RankedSwgaSubmission,
  fetcher: typeof fetch = fetch,
): Promise<RankedSubmissionResult> {
  try {
    const response = await fetcher(RANKED_SWGA_RUNS_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId: payload.submissionId,
        score: payload.score,
        outcome: payload.outcome,
        highestWordLengthReached: payload.highestWordLengthReached,
      }),
    });

    if (await isControlledSavedResponse(response)) {
      return "saved";
    }

    if (response.status === 401) {
      return "authentication-required";
    }

    if (response.status === 403) {
      return "profile-required";
    }

    if (response.status === 409) {
      return "conflict";
    }

    return "retryable-error";
  } catch {
    return "retryable-error";
  }
}
