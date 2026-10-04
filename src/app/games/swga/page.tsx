import type { Metadata } from "next";
import { SwgaGame } from "@/games/swga/components/swga-game";
import { readSwgaPersonalBest } from "@/games/swga/logic/personal-best-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SWGA | JSG Games",
  description: "Play the SWGA word-guessing run from one to twenty letters.",
};

export default async function SwgaPage() {
  return <SwgaGame personalBest={await readSwgaPersonalBest()} />;
}
