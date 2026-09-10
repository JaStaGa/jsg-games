import { copperlightCity, type CopperlightResident } from "../data/copperlight-city";
import type { PlayableCharacterGame } from "../playable";

export const copperlightCityGame: PlayableCharacterGame<CopperlightResident> = {
  theme: copperlightCity,
  rankedThemeId: "copperlight-city",
  title: "Character Guessing",
  themeName: "Copperlight City",
  subtitle: "Meet the makers behind the lantern-lit streets.",
  introTitle: "A city of curious connections.",
  introDescription: "Find a mystery resident by following shared traits. Explore the resident guide before starting, then put your deductions to the test.",
  traitInstructions: "Profession and District match exactly. A shared Specialty or Affiliation reveals the target’s full list for that trait.",
  inputHelp: "Use a resident name you haven’t guessed this round. Press Enter to submit.",
  guideTitle: "Resident guide · names & traits",
  guideDescription: `All ${copperlightCity.characters.length} residents are listed here. Compare their traits with your clues. Opening the guide does not pause a running game.`,
  uiCopy: {
    unknownName: "Choose a name from the resident list.",
    mysteryCharacter: "resident",
    activeHeadline: "Find the resident",
  },
};
