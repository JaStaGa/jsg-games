import { signIn } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import styles from "@/components/auth-shell.module.css";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const recoveryComplete = (await searchParams).recovery === "complete";

  return (
    <AuthShell
      eyebrow="Account access"
      title="Sign in"
      description="Sign in with your confirmed JSG Games email address and password."
    >
      {recoveryComplete ? (
        <p className={styles.formSuccess} role="status">
          Your password has been updated. Sign in with your new password.
        </p>
      ) : null}
      <AuthForm
        action={signIn}
        alternateHref="/signup"
        alternateLabel="Create account"
        alternatePrompt="New to JSG Games?"
        forgotPasswordHref="/forgot-password"
        passwordAutocomplete="current-password"
        pendingLabel="Signing in…"
        submitLabel="Sign in"
      />
    </AuthShell>
  );
}
