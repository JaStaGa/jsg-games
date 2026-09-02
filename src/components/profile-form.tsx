"use client";

import { useActionState } from "react";
import { createProfile, updateProfile } from "@/app/profile/actions";
import {
  INITIAL_PROFILE_ACTION_STATE,
  USERNAME_PATTERN_SOURCE,
} from "@/lib/profile/validation";
import styles from "./auth-shell.module.css";

type ProfileFormProps = {
  currentUsername?: string;
  mode: "create" | "update";
};

export function ProfileForm({ currentUsername, mode }: ProfileFormProps) {
  const action = mode === "create" ? createProfile : updateProfile;
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_PROFILE_ACTION_STATE,
  );
  const usernameError = state.fieldErrors?.username;

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="username">Username</label>
        <input
          aria-describedby={
            usernameError
              ? "username-error username-hint"
              : "username-hint"
          }
          aria-invalid={Boolean(usernameError)}
          autoCapitalize="none"
          autoComplete="username"
          defaultValue={currentUsername}
          id="username"
          maxLength={20}
          minLength={3}
          name="username"
          pattern={USERNAME_PATTERN_SOURCE}
          required
          spellCheck={false}
          type="text"
        />
        <span className={styles.hint} id="username-hint">
          3–20 letters, numbers, or underscores. Start with a letter or number.
        </span>
        {usernameError ? (
          <span className={styles.fieldError} id="username-error">
            {usernameError}
          </span>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? styles.formSuccess
              : styles.formError
          }
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}

      <button className={styles.submit} disabled={pending} type="submit">
        {pending
          ? mode === "create"
            ? "Creating profile…"
            : "Saving username…"
          : mode === "create"
            ? "Create profile"
            : "Save username"}
      </button>
    </form>
  );
}
