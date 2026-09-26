import type { ReactNode } from "react";
import { PageFrame, Surface } from "@/components/page-surfaces";
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
    <PageFrame className={styles.page}>
      <Surface as="section" className={styles.card} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id="auth-title">{title}</h1>
        <p className={styles.description}>{description}</p>
        {children}
      </Surface>
    </PageFrame>
  );
}
