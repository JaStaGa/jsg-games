import type { ReactNode } from "react";
import styles from "./auth-shell.module.css";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id="auth-title">{title}</h1>
        <p className={styles.description}>{description}</p>
        {children}
      </section>
    </main>
  );
}
