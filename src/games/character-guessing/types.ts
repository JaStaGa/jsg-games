export type TraitDefinition<Character> = {
  readonly key: string;
  readonly label: string;
} & (
  | { readonly match: "exact"; readonly value: (character: Character) => string }
  | { readonly match: "overlap"; readonly value: (character: Character) => readonly string[] }
);

export interface ThemeConfig<Character> {
  readonly id: string;
  readonly characters: readonly Character[];
  readonly name: (character: Character) => string;
  readonly traits: readonly TraitDefinition<Character>[];
}

export interface TraitHint {
  readonly key: string;
  readonly label: string;
  /** Full target value(s), including all values when any overlap is found. */
  readonly values: readonly string[];
}

export interface Guess {
  readonly text: string;
  readonly atMs: number;
  readonly correct: boolean;
  readonly newTraits: readonly TraitHint[];
}

export interface Round {
  readonly targetName: string;
  readonly guesses: readonly Guess[];
  readonly status: "guessing" | "correct" | "exhausted" | "timed-out";
  readonly revealed: boolean;
  readonly score: number;
}

export interface Session {
  readonly themeId: string;
  readonly startedAtMs: number;
  readonly deadlineMs: number;
  readonly status: "playing" | "timed-out" | "exhausted";
  readonly rounds: readonly Round[];
  readonly score: number;
}
