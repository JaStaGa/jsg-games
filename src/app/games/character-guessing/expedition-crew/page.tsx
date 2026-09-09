import type { Metadata } from "next";
import { ExpeditionCrewGame } from "@/games/character-guessing/components/expedition-crew-game";

export const metadata: Metadata = {
  title: "Expedition Crew | Character Guessing | JSG Games",
  description: "Meet the Expedition Crew. Use shared traits to guess as many characters as you can in 60 seconds.",
};

export default function ExpeditionCrewPage() {
  return <ExpeditionCrewGame />;
}
