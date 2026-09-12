import type { Metadata } from "next";
import Link from "next/link";
import { characterThemes } from "@/games/character-guessing/themes/catalog";
import styles from "@/games/character-guessing/components/theme-selection.module.css";

export const metadata: Metadata = {
  title: "Character Guessing | JSG Games",
  description: "Choose a Character Guessing theme and use clues and comparisons to identify mystery targets in 60 seconds.",
};

export default function CharacterGuessingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Choose your theme</p>
        <h1>Character Guessing</h1>
        <p>One minute. Five guesses per target. Use clues and comparisons to narrow the possibilities and solve as many mysteries as you can.</p>
      </header>
      <section aria-labelledby="themes-title">
        <h2 id="themes-title">Explore the themes</h2>
        <ul className={styles.themes}>
          {characterThemes.map((theme) => (
            <li key={theme.id} className={styles.card}>
              <h3>{theme.name}</h3>
              <p>{theme.description}</p>
              <Link className={styles.play} href={theme.href}>Play {theme.name}</Link>
            </li>
          ))}
        </ul>
      </section>
      <p className={styles.note}>Each theme includes a candidate guide. Take a look before starting the clock.</p>
    </main>
  );
}
