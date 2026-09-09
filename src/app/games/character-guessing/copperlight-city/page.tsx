import type { Metadata } from "next";
import { CopperlightCityGame } from "@/games/character-guessing/components/copperlight-city-game";

export const metadata: Metadata = {
  title: "Copperlight City | Character Guessing | JSG Games",
  description: "Find Copperlight City's mystery residents through shared professions, districts, specialties and affiliations in 60 seconds.",
};

export default function CopperlightCityPage() {
  return <CopperlightCityGame />;
}
