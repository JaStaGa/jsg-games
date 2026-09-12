import type { Metadata } from "next";
import { NbaMvpsGame } from "@/games/character-guessing/components/nba-mvps-game";

export const metadata: Metadata = {
  title: "NBA MVPs | Character Guessing | JSG Games",
  description: "Find the mystery NBA MVP season using season, team and regular-season statistics. A 53-season unranked practice prototype.",
};

export default function NbaMvpsPage() {
  return <NbaMvpsGame />;
}
