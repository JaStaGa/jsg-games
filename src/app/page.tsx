import { gameRegistry } from "@/games/registry";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="page-title">
        <p className={styles.eyebrow}>Phase 2 foundation</p>
        <h1 id="page-title">JSG Games</h1>
        <p className={styles.intro}>
          A shared home for game experiences. The application foundation is in
          place, and game migrations will follow in later phases.
        </p>

        <div className={styles.status}>
          <h2>Games</h2>
          <p>
            {gameRegistry.length === 0
              ? "No games have been migrated yet."
              : `${gameRegistry.length} games available.`}
          </p>
        </div>
      </section>
    </main>
  );
}
