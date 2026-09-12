export interface GameRegistration {
  slug: string;
  name: string;
  summary: string;
  href: `/games/${string}`;
}

export const gameRegistry: readonly GameRegistration[] = [
  {
    slug: "character-guessing",
    name: "Character Guessing",
    summary: "Choose a theme and use clues and comparisons to identify mystery targets in 60 seconds.",
    href: "/games/character-guessing",
  },
  {
    slug: "swga",
    name: "SWGA",
    summary: "A word-guessing run that grows from one letter to twenty.",
    href: "/games/swga",
  },
];
