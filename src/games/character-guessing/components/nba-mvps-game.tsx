"use client";

import { nbaMvpsGame } from "../themes/nba-mvps";
import { CharacterGuessingGame } from "./character-guessing-game";

/** Function-containing definitions stay inside the client module graph. */
export function NbaMvpsGame() {
  return <CharacterGuessingGame definition={nbaMvpsGame} />;
}
