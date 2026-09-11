import type { ThemeConfig } from "../types";
import type { PlayableCharacterGame } from "../playable";

type Workshop = { identity: { title: string }; category: string; capacity: number; wins: number; losses: number };
export const comparisonGame = {
  theme: {
    id: "test-workshops",
    characters: [
      { identity: { title: "Willow" }, category: "Craft", capacity: 30, wins: 50, losses: 32 },
      { identity: { title: "Birch" }, category: " craft ", capacity: 25, wins: 20, losses: 10 },
      { identity: { title: "Cedar" }, category: "Design", capacity: 35, wins: 50, losses: 32 },
    ],
    name: (character: Workshop) => character.identity.title,
    traits: [],
  },
  comparisonColumns: [
    { key: "category", label: "Category", kind: "exact", value: (character: Workshop) => character.category },
    { key: "capacity", label: "Capacity", kind: "ordered", value: (character: Workshop) => character.capacity, display: (character: Workshop) => character.capacity.toFixed(1) },
    { key: "record", label: "Workshop record", kind: "ordered", value: (character: Workshop) => character.wins / (character.wins + character.losses), display: (character: Workshop) => `${character.wins}-${character.losses}` },
  ],
  title: "Workshop Guessing", themeName: "Test Workshops", subtitle: "Find the mystery workshop.",
  introTitle: "Workshop mystery", introDescription: "Compare workshop values.",
  traitInstructions: "Each guess shows matches and directions toward the target.", inputHelp: "Choose a workshop from the guide.",
  guideTitle: "Workshop guide", guideDescription: "Meet the workshops.",
} satisfies PlayableCharacterGame<Workshop>;

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
