import type { ThemeConfig } from "../types";

type Resident = { name: string; job: string; town: string };
export const residents: ThemeConfig<Resident> = {
  id: "residents",
  characters: [
    { name: "Alice", job: "Baker", town: "Brook" },
    { name: "Bob", job: " baker ", town: "Hill" },
    { name: "Carol", job: "Pilot", town: "BROOK" },
  ],
  name: (character) => character.name,
  traits: [
    { key: "job", label: "Job", match: "exact", value: (character) => character.job },
    { key: "town", label: "Town", match: "exact", value: (character) => character.town },
  ],
};

type Explorer = { displayName: string; skills: readonly string[]; rank: string };
export const explorers: ThemeConfig<Explorer> = {
  id: "explorers",
  characters: [
    { displayName: "Dara", skills: ["Sailing", "Mapping"], rank: "Lead" },
    { displayName: "Eli", skills: [" sailing ", "Cooking"], rank: "Scout" },
    { displayName: "Fern", skills: ["MAPPING"], rank: "Lead" },
  ],
  name: (character) => character.displayName,
  traits: [
    { key: "skills", label: "Skills", match: "overlap", value: (character) => character.skills },
    { key: "rank", label: "Rank", match: "exact", value: (character) => character.rank },
  ],
};
