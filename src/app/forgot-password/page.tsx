import { AuthShell } from "@/components/auth-shell";
import styles from "@/components/auth-shell.module.css";
import { RecoveryRequestForm } from "@/components/recovery-request-form";

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const invalidRecovery = (await searchParams).recovery === "invalid";

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your JSG Games email address to request a password reset link."
    >
      {invalidRecovery ? (
        <p className={styles.formError} role="alert">
          That recovery link is invalid, expired, or has already been used.
          Request another reset email below.
        </p>
      ) : null}
      <RecoveryRequestForm />
    </AuthShell>
  );
}
