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
] as const;
