"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  INITIAL_AUTH_ACTION_STATE,
  MIN_PASSWORD_LENGTH,
  type AuthActionState,
} from "@/lib/auth/validation";
import styles from "./auth-shell.module.css";

type AuthAction = (
  state: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

type AuthFormProps = {
  action: AuthAction;
  alternateHref: string;
  alternateLabel: string;
  alternatePrompt: string;
  passwordAutocomplete: "current-password" | "new-password";
  pendingLabel: string;
  submitLabel: string;
};

export function AuthForm({
  action,
  alternateHref,
  alternateLabel,
  alternatePrompt,
  passwordAutocomplete,
  pendingLabel,
  submitLabel,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_AUTH_ACTION_STATE,
  );
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

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

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            aria-describedby={
              passwordError ? "password-error password-hint" : "password-hint"
            }
            aria-invalid={Boolean(passwordError)}
            autoComplete={passwordAutocomplete}
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

        {state.message ? (
          <p className={styles.formError} role="alert">
            {state.message}
          </p>
        ) : null}

        <button className={styles.submit} disabled={pending} type="submit">
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>

      <p className={styles.alternate}>
        {alternatePrompt} <Link href={alternateHref}>{alternateLabel}</Link>
      </p>
    </>
  );
}
