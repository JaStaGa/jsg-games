"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordRecovery } from "@/app/auth/recovery-actions";
import {
  INITIAL_RECOVERY_REQUEST_STATE,
  RECOVERY_SUCCESS_MESSAGE,
} from "@/lib/auth/recovery";
import styles from "./auth-shell.module.css";

export function RecoveryRequestForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordRecovery,
    INITIAL_RECOVERY_REQUEST_STATE,
  );
  const emailError = state.fieldErrors?.email;

  if (state.status === "success") {
    return (
      <>
        <p className={styles.formSuccess} role="status">
          {state.message ?? RECOVERY_SUCCESS_MESSAGE}
        </p>
        <div className={styles.statusActions}>
          <Link className={styles.primaryLink} href="/login">
            Return to sign in
          </Link>
          <Link className={styles.secondaryLink} href="/forgot-password">
            Request another email
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <form className={styles.form} action={formAction}>
        <div className={styles.field}>
          <label htmlFor="email">Email address</label>
          <input
            aria-describedby={emailError ? "email-error" : undefined}
            aria-invalid={Boolean(emailError)}
            autoCapitalize="none"
            autoComplete="email"
            id="email"
            inputMode="email"
            name="email"
            required
            spellCheck={false}
            type="email"
          />
          {emailError ? (
            <span className={styles.fieldError} id="email-error">
              {emailError}
            </span>
          ) : null}
        </div>

        {state.message ? (
          <p className={styles.formError} role="alert">
            {state.message}
          </p>
        ) : null}

        <button className={styles.submit} disabled={pending} type="submit">
          {pending ? "Sending reset email…" : "Send reset email"}
        </button>
      </form>

      <p className={styles.alternate}>
        Remembered your password? <Link href="/login">Return to sign in</Link>
      </p>
    </>
  );
}
