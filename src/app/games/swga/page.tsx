import type { Metadata } from "next";
import { SwgaGame } from "@/games/swga/components/swga-game";

export const metadata: Metadata = {
  title: "SWGA | JSG Games",
  description: "Play the SWGA word-guessing run from one to twenty letters.",
};

export default function SwgaPage() {
  return <SwgaGame />;
}
