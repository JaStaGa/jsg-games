/** Serializable discovery metadata only; theme getters stay in client wrappers. */
export const characterThemes = [
  {
    id: "expedition-crew",
    name: "Expedition Crew",
    description: "Meet 24 explorers from distant regions. Follow their roles and shared skills to find your mystery crew member.",
    href: "/games/character-guessing/expedition-crew",
  },
  {
    id: "copperlight-city",
    name: "Copperlight City",
    description: "Meet 24 makers in a lantern-lit city. Connect professions, districts, specialties and affiliations to uncover a mystery resident.",
    href: "/games/character-guessing/copperlight-city",
  },
  {
    id: "nba-mvps",
    name: "NBA MVPs",
    description: "Find a mystery MVP-winning season using team and statistical comparisons. 53 seasons from 1973-74 to 2025-26. Practice · unranked.",
    href: "/games/character-guessing/nba-mvps",
  },
] as const;
