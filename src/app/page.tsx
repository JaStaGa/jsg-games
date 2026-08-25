import Link from "next/link";
import { gameRegistry } from "@/games/registry";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="page-title">
        <p className={styles.eyebrow}>Playable games</p>
        <h1 id="page-title">JSG Games</h1>
        <p className={styles.intro}>
          A shared home for game experiences. Choose a game below to start
          playing.
        </p>

        <div className={styles.status}>
          <h2>Games</h2>
          <p>
            {gameRegistry.length === 1
              ? "1 game available."
              : `${gameRegistry.length} games available.`}
          </p>
          <ul className={styles.gameList}>
            {gameRegistry.map((game) => (
              <li key={game.slug}>
                <Link className={styles.gameLink} href={game.href}>
                  <strong>{game.name}</strong>
                  <span>{game.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
