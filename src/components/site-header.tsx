import Link from "next/link";
import { AuthControls } from "./auth-controls";
import { SiteNavigation } from "./site-navigation";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <SiteNavigation brand={
        <Link className={styles.brand} href="/">
          JSG Games
        </Link>
      }>
        <PublicNavigation />
        <AuthControls />
      </SiteNavigation>
    </header>
  );
}

export function PublicNavigation() {
  return (
    <nav className={styles.siteNav} aria-label="Site">
      <Link className={styles.navLink} href="/leaderboard">
        Leaderboard
      </Link>
    </nav>
  );
}
