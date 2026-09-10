import Link from "next/link";
import type { RankedSubmissionAttempt } from "../logic/ranked-client";
import styles from "./character-guessing-game.module.css";

export function RankedResult({ attempt, onRetry }: {
  attempt: RankedSubmissionAttempt;
  onRetry: () => void;
}) {
  return (
    <div className={styles.rankedResult} aria-live="polite" aria-atomic="true">
      <h3>Ranked result</h3>
      {attempt.status === "saving" && <p>Saving ranked run…</p>}
      {attempt.status === "saved" && <p>Ranked run saved.</p>}
      {attempt.status === "authentication-required" && (
        <p>This run could not be saved because sign-in is required. <Link href="/login">Sign in</Link></p>
      )}
      {attempt.status === "profile-required" && (
        <p>This run could not be saved because a player profile is required. <Link href="/profile">Set up your profile</Link></p>
      )}
      {attempt.status === "conflict" && <p>This run conflicts with an earlier submission and could not be saved.</p>}
      {attempt.status === "retryable-error" && (
        <><p>We couldn&apos;t save this ranked run.</p><button type="button" className={styles.button} onClick={onRetry}>Retry</button></>
      )}
    </div>
  );
}
