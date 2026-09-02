"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword } from "@/app/auth/recovery-actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import { INITIAL_PASSWORD_UPDATE_STATE } from "@/lib/auth/recovery";
import styles from "./auth-shell.module.css";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    INITIAL_PASSWORD_UPDATE_STATE,
  );
  const passwordError = state.fieldErrors?.password;
  const confirmPasswordError = state.fieldErrors?.confirmPassword;

  return (
    <>
      <form className={styles.form} action={formAction}>
        <div className={styles.field}>
          <label htmlFor="password">New password</label>
          <input
            aria-describedby={
              passwordError ? "password-error password-hint" : "password-hint"
            }
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            id="password"
            minLength={MIN_PASSWORD_LENGTH}
            name="password"
            required
            type="password"
          />
          <span className={styles.hint} id="password-hint">
            At least {MIN_PASSWORD_LENGTH} characters. No extra complexity rules.
          </span>
          {passwordError ? (
            <span className={styles.fieldError} id="password-error">
              {passwordError}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            aria-describedby={
              confirmPasswordError ? "confirm-password-error" : undefined
            }
            aria-invalid={Boolean(confirmPasswordError)}
            autoComplete="new-password"
            id="confirmPassword"
            minLength={MIN_PASSWORD_LENGTH}
            name="confirmPassword"
            required
            type="password"
          />
          {confirmPasswordError ? (
            <span className={styles.fieldError} id="confirm-password-error">
              {confirmPasswordError}
            </span>
          ) : null}
        </div>

        {state.message ? (
          <p className={styles.formError} role="alert">
            {state.message}
          </p>
        ) : null}

        <button className={styles.submit} disabled={pending} type="submit">
          {pending ? "Updating password…" : "Update password"}
        </button>
      </form>

      <p className={styles.alternate}>
        Recovery link not working?{" "}
        <Link href="/forgot-password">Request another email</Link>
      </p>
    </>
  );
}
