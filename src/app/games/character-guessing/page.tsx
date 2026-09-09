import type { Metadata } from "next";
import { CharacterGuessingGame } from "@/games/character-guessing/components/character-guessing-game";

export const metadata: Metadata = {
  title: "Character Guessing | JSG Games",
  description: "Meet the Expedition Crew. Use shared traits to guess as many characters as you can in 60 seconds.",
};

export default function CharacterGuessingPage() {
  return <CharacterGuessingGame />;
}
