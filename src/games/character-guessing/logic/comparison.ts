import type { ComparisonColumn } from "../playable";
import type { Round, ThemeConfig } from "../types";
import { normalizeName } from "./traits";

export type ComparisonOutcome = "equal" | "target-higher" | "target-lower" | "different";
export interface ComparisonResult {
  readonly key: string;
  readonly label: string;
  readonly display: string;
  readonly outcome: ComparisonOutcome;
}

export const comparisonLabels: Record<ComparisonOutcome, string> = {
  equal: "Match", "target-higher": "Target is higher", "target-lower": "Target is lower", different: "Different",
};

function finite(value: number, key: string): number {
  if (!Number.isFinite(value)) throw new Error(`Comparison column "${key}" requires finite numeric values.`);
  return value;
}

/** Fail fast for malformed definitions, including candidates not guessed yet. */
export function validateComparisonColumns<Character>(columns: readonly ComparisonColumn<Character>[], characters: readonly Character[]): void {
  const keys = columns.map((column) => column.key);
  if (!keys.length || keys.some((key) => !key.trim()) || new Set(keys).size !== keys.length) {
    throw new Error("Comparison columns require nonblank, unique keys and at least one column.");
  }
  for (const column of columns) {
    if (column.kind === "ordered") for (const character of characters) finite(column.value(character), column.key);
  }
}

/** Direction always points from the guess toward the target; never returns target values. */
export function compareColumns<Character>(columns: readonly ComparisonColumn<Character>[], guess: Character, target: Character): ComparisonResult[] {
  return columns.map((column) => {
    let outcome: ComparisonOutcome;
    let display: string;
    if (column.kind === "exact") {
      const guessed = column.value(guess);
      outcome = normalizeName(guessed) === normalizeName(column.value(target)) ? "equal" : "different";
      display = column.display ? column.display(guess) : guessed;
    } else {
      const guessed = finite(column.value(guess), column.key);
      const targeted = finite(column.value(target), column.key);
      outcome = targeted > guessed ? "target-higher" : targeted < guessed ? "target-lower" : "equal";
      display = column.display(guess);
    }
    return { key: column.key, label: column.label, display, outcome };
  });
}

export function getComparisonRows<Character>(theme: ThemeConfig<Character>, columns: readonly ComparisonColumn<Character>[], round?: Round) {
  if (!round?.guesses.length) return [];
  const find = (name: string) => theme.characters.find((character) => normalizeName(theme.name(character)) === normalizeName(name));
  const target = find(round.targetName);
  if (target === undefined) throw new Error("Comparison target is missing from the theme.");
  return round.guesses.map((guess) => {
    const character = find(guess.text);
    if (character === undefined) throw new Error("Comparison guess is missing from the theme.");
    return { name: theme.name(character), correct: guess.correct, cells: compareColumns(columns, character, target) };
  });
}
