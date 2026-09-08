import type { TraitDefinition, TraitHint } from "../types";

export function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

/** Matching is trimmed/case-insensitive; missing or blank values never match. */
export function compareTraits<Character>(
  traits: readonly TraitDefinition<Character>[],
  guess: Character,
  target: Character,
  discoveredKeys: ReadonlySet<string> = new Set(),
): TraitHint[] {
  const hints: TraitHint[] = [];
  for (const trait of traits) {
    if (discoveredKeys.has(trait.key)) continue;
    const targetValues = trait.match === "exact" ? [trait.value(target)] : trait.value(target);
    const guessValues = trait.match === "exact" ? [trait.value(guess)] : trait.value(guess);
    const normalized = new Set(guessValues.map(normalizeName).filter(Boolean));
    if (targetValues.some((value) => normalized.has(normalizeName(value)))) {
      hints.push({ key: trait.key, label: trait.label, values: [...targetValues] });
    }
  }
  return hints;
}
