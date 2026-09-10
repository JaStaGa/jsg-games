import type { RankedCharacterSubmission, RankedCharacterThemeId } from "./ranked-submission";
import type { Session } from "../types";

export const RANKED_CHARACTER_RUNS_ENDPOINT = "/api/games/character-guessing/runs";

export type RankedSubmissionResult =
  | "saved" | "authentication-required" | "profile-required" | "conflict" | "retryable-error";

export interface RankedSubmissionAttempt {
  readonly payload: RankedCharacterSubmission;
  readonly status: "saving" | RankedSubmissionResult;
}

export function ensureRankedSubmissionId(
  themeId: RankedCharacterThemeId | undefined,
  existingId: string | null,
  createId: () => string = () => crypto.randomUUID(),
): string | null {
  return themeId === undefined ? null : existingId ?? createId();
}

export function buildRankedCharacterSubmission({ session, themeId, submissionId }: {
  session: Session;
  themeId: RankedCharacterThemeId | undefined;
  submissionId: string | null;
}): RankedCharacterSubmission | null {
  if (!themeId || !submissionId || session.rounds.length === 0
    || (session.status !== "timed-out" && session.status !== "exhausted")) return null;
  return {
    submissionId, themeId, score: session.score, outcome: session.status,
    roundsPlayed: session.rounds.length,
    solved: session.rounds.filter((round) => round.status === "correct").length,
  };
}

export function beginRankedSubmission(payload: RankedCharacterSubmission): RankedSubmissionAttempt {
  return { payload, status: "saving" };
}

export function settleRankedSubmission(
  current: RankedSubmissionAttempt | null, submissionId: string, result: RankedSubmissionResult,
): RankedSubmissionAttempt | null {
  return current?.payload.submissionId === submissionId ? { ...current, status: result } : current;
}

export async function submitRankedCharacterRun(
  payload: RankedCharacterSubmission, fetcher: typeof fetch = fetch,
): Promise<RankedSubmissionResult> {
  try {
    const response = await fetcher(RANKED_CHARACTER_RUNS_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId: payload.submissionId, themeId: payload.themeId,
        score: payload.score, outcome: payload.outcome,
        roundsPlayed: payload.roundsPlayed, solved: payload.solved,
      }),
    });
    if (response.status === 401) return "authentication-required";
    if (response.status === 403) return "profile-required";
    if (response.status === 409) return "conflict";
    if (response.status === 200 || response.status === 201) {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null && "ok" in body && body.ok === true
        && "status" in body && ((response.status === 201 && body.status === "created")
          || (response.status === 200 && body.status === "already_recorded"))) return "saved";
    }
    return "retryable-error";
  } catch {
    return "retryable-error";
  }
}
