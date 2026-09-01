import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import styles from "@/components/auth-shell.module.css";

export default function CheckEmailPage() {
  return (
    <AuthShell
      eyebrow="Confirmation required"
      title="Check your email"
      description="If the address can be used for an account, a confirmation email will arrive shortly. Follow its link, then return to JSG Games and sign in."
    >
      <div className={styles.statusActions}>
        <Link className={styles.primaryLink} href="/login">
          Go to sign in
        </Link>
        <Link className={styles.secondaryLink} href="/">
          Return home
        </Link>
      </div>
    </AuthShell>
  );
}
