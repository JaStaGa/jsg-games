export interface GameRegistration {
  slug: string;
  name: string;
  summary: string;
  href: `/games/${string}`;
}

export const gameRegistry: readonly GameRegistration[] = [];
