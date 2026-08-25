export const TIMED_RUN_DURATION_MS = 60_000;

export function createTimerDeadline(
  startedAtMs: number,
  durationMs: number = TIMED_RUN_DURATION_MS,
): number {
  return startedAtMs + durationMs;
}

export function getRemainingTimeMs(
  deadlineMs: number,
  currentTimeMs: number,
): number {
  return Math.max(0, deadlineMs - currentTimeMs);
}

export function hasTimerExpired(
  deadlineMs: number,
  currentTimeMs: number,
): boolean {
  return currentTimeMs >= deadlineMs;
}

export function formatRemainingTime(remainingTimeMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingTimeMs) / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
