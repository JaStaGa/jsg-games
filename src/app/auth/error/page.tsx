import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import styles from "@/components/auth-shell.module.css";

export default function AuthErrorPage() {
  return (
    <AuthShell
      eyebrow="Confirmation problem"
      title="We could not confirm that link"
      description="The confirmation link is missing, unsupported, expired, or already used. You can return to sign in or create an account again."
    >
      <div className={styles.statusActions}>
        <Link className={styles.primaryLink} href="/login">
          Go to sign in
        </Link>
        <Link className={styles.secondaryLink} href="/signup">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
