import Link from "next/link";
import { AuthControls } from "./auth-controls";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          JSG Games
        </Link>
        <div className={styles.headerActions}>
          <span className={styles.phase}>Foundation</span>
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
