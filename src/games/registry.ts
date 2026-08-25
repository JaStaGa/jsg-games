export interface GameRegistration {
  slug: string;
  name: string;
  summary: string;
  href: `/games/${string}`;
}

export const gameRegistry: readonly GameRegistration[] = [
  {
    slug: "swga",
    name: "SWGA",
    summary: "A word-guessing run that grows from one letter to twenty.",
    href: "/games/swga",
  },
];
