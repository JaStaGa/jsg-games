import Link from "next/link";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          JSG Games
        </Link>
        <span className={styles.phase}>Foundation</span>
      </div>
    </header>
  );
}
