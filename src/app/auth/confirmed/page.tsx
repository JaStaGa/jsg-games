import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import styles from "@/components/auth-shell.module.css";

export default function ConfirmedPage() {
  return (
    <AuthShell
      eyebrow="Account confirmed"
      title="Email confirmed"
      description="Your email is confirmed, and this browser now has a signed-in session."
    >
      <div className={styles.statusActions}>
        <Link className={styles.primaryLink} href="/">
          Continue to JSG Games
        </Link>
      </div>
    </AuthShell>
  );
}
