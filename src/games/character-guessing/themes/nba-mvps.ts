import { nbaMvps, type NbaMvpSeason } from "../data/nba-mvps";
import type { ComparisonColumn, PlayableCharacterGame } from "../playable";

export const nbaMvpColumns: readonly ComparisonColumn<NbaMvpSeason>[] = [
  { key: "season", label: "Season", kind: "ordered", value: (candidate) => candidate.seasonStartYear, display: (candidate) => candidate.season },
  { key: "team", label: "Team", kind: "exact", value: (candidate) => candidate.team },
  { key: "ppg", label: "PPG", kind: "ordered", value: (candidate) => candidate.ppg, display: (candidate) => candidate.ppg.toFixed(1) },
  { key: "rpg", label: "RPG", kind: "ordered", value: (candidate) => candidate.rpg, display: (candidate) => candidate.rpg.toFixed(1) },
  { key: "apg", label: "APG", kind: "ordered", value: (candidate) => candidate.apg, display: (candidate) => candidate.apg.toFixed(1) },
  { key: "spg", label: "SPG", kind: "ordered", value: (candidate) => candidate.spg, display: (candidate) => candidate.spg.toFixed(1) },
  { key: "bpg", label: "BPG", kind: "ordered", value: (candidate) => candidate.bpg, display: (candidate) => candidate.bpg.toFixed(1) },
  { key: "team-record", label: "Team Record", kind: "ordered", value: (candidate) => candidate.wins / (candidate.wins + candidate.losses), display: (candidate) => `${candidate.wins}-${candidate.losses}` },
];

export const nbaMvpsGame: PlayableCharacterGame<NbaMvpSeason> = {
  theme: nbaMvps,
  comparisonColumns: nbaMvpColumns,
  title: "Character Guessing",
  themeName: "NBA MVPs",
  subtitle: "Find the mystery NBA MVP season. Practice prototype · unranked.",
  introTitle: "MVP seasons. Sixty seconds.",
  introDescription: "Each candidate is one MVP-winning season, from 1973-74 through 2025-26. Repeat winners appear more than once: choose both the player and season.",
  traitInstructions: "↑ Target season/stat is higher. ↓ Target season/stat is lower. ✓ Match: equal value or team. ≠ Different team. Team Record compares winning percentage even though W-L is displayed.",
  inputHelp: "Choose the full player-season label, such as LeBron James — 2012-13. Press Enter to submit.",
  guideTitle: "MVP season guide · names & statistics",
  guideDescription: "All 53 MVP-winning seasons. PPG, RPG, APG, SPG and BPG are regular-season points, rebounds, assists, steals and blocks per game. Team Record shows regular-season wins and losses. Opening the guide does not pause the clock.",
  uiCopy: {
    unknownName: "Choose a full player-season name from the MVP season guide.",
    mysteryCharacter: "NBA MVP season",
    activeHeadline: "Find the MVP season",
    inputLabel: "MVP season",
    inputPlaceholder: "Type or select a player-season",
    candidateSingular: "MVP season",
    candidatePlural: "MVP seasons",
  },
};
