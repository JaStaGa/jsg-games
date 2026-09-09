import { expeditionCrew, type CrewMember } from "../data/expedition-crew";
import type { PlayableCharacterGame } from "../playable";

export const expeditionCrewGame: PlayableCharacterGame<CrewMember> = {
  theme: expeditionCrew,
  title: "Character Guessing",
  themeName: "Expedition Crew",
  subtitle: "Meet a mystery crew member. Let shared traits point the way.",
  introTitle: "One crew. Sixty seconds.",
  introDescription: "Guess a name to uncover matching traits. Use the crew guide below to narrow your next guess.",
  traitInstructions: "Role and Region match exactly. A shared Skill reveals the target’s full skill list.",
  inputHelp: "Use a crew name you haven’t guessed this round. Press Enter to submit.",
  guideTitle: "Crew guide · names & traits",
  guideDescription: `All ${expeditionCrew.characters.length} crew members are listed here. Compare their traits with your clues. Opening the guide does not pause a running game.`,
  uiCopy: {
    unknownName: "Choose a name from the crew list.",
    mysteryCharacter: "crew member",
    activeHeadline: "Find the crew member",
  },
};
