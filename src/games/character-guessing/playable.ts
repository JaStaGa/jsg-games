import type { ThemeConfig } from "./types";
import type { RankedCharacterThemeId } from "./logic/ranked-submission";

export type ComparisonColumn<Character> = {
  readonly key: string;
  readonly label: string;
} & (
  | { readonly kind: "exact"; readonly value: (character: Character) => string; readonly display?: (character: Character) => string }
  | { readonly kind: "ordered"; readonly value: (character: Character) => number; readonly display: (character: Character) => string }
);

/** Optional flavor text; shared helpers fall back to neutral character wording. */
export interface GameUiCopy {
  readonly unknownName: string;
  readonly mysteryCharacter: string;
  readonly activeHeadline: string;
  readonly inputLabel: string;
  readonly inputPlaceholder: string;
  readonly candidateSingular: string;
  readonly candidatePlural: string;
}

/** Keep this definition stable for a mounted game; remount to switch themes. */
export interface PlayableCharacterGame<Character> {
  readonly theme: ThemeConfig<Character>;
  /** Optional presentation mode; does not change engine traits or session rules. */
  readonly comparisonColumns?: readonly ComparisonColumn<Character>[];
  /** Explicit opt-in; no database identity or ownership is browser-configurable. */
  readonly rankedThemeId?: RankedCharacterThemeId;
  readonly title: string;
  readonly themeName: string;
  readonly subtitle: string;
  readonly introTitle: string;
  readonly introDescription: string;
  readonly traitInstructions: string;
  readonly inputHelp: string;
  readonly guideTitle: string;
  readonly guideDescription: string;
  readonly uiCopy?: Partial<GameUiCopy>;
}
