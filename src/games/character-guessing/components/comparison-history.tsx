import type { ComparisonColumn } from "../playable";
import { comparisonLabels, type ComparisonOutcome, type ComparisonResult } from "../logic/comparison";
import styles from "./character-guessing-game.module.css";

const symbols: Record<ComparisonOutcome, string> = { equal: "✓", "target-higher": "↑", "target-lower": "↓", different: "≠" };

export function ComparisonHistory<Character>({ columns, rows }: {
  columns: readonly ComparisonColumn<Character>[];
  rows: readonly { name: string; correct: boolean; cells: readonly ComparisonResult[] }[];
}) {
  return <section className={styles.comparison} aria-labelledby="comparison-title">
    <h3 id="comparison-title">This round’s comparisons</h3>
    <p className={styles.muted}>Directions point from your guess toward the mystery target. Scroll the table to see all columns.</p>
    {rows.length ? <div className={styles.comparisonFrame} role="region" aria-label="Guess comparisons" tabIndex={0}>
      <table className={styles.comparisonTable}>
        <caption>Guessed values · latest guess last</caption>
        <thead><tr><th scope="col">Guessed character</th>{columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.name} className={index === rows.length - 1 ? styles.latestComparison : undefined}>
          <th scope="row">{row.name}<span>{row.correct ? "Correct" : "Incorrect"}{index === rows.length - 1 ? " · Latest guess" : ""}</span></th>
          {row.cells.map((cell) => <td key={cell.key}>{cell.display} <span aria-hidden="true">{symbols[cell.outcome]}</span><small>{comparisonLabels[cell.outcome]}</small></td>)}
        </tr>)}</tbody>
      </table>
    </div> : <p className={styles.muted}>Submit a guess to see its comparisons.</p>}
  </section>;
}
