import type { ThemeConfig } from "./types";

/** Optional flavor text; shared helpers fall back to neutral character wording. */
export interface GameUiCopy {
  readonly unknownName: string;
  readonly mysteryCharacter: string;
  readonly activeHeadline: string;
}

/** Keep this definition stable for a mounted game; remount to switch themes. */
export interface PlayableCharacterGame<Character> {
  readonly theme: ThemeConfig<Character>;
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
