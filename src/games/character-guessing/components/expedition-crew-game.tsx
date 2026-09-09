"use client";

import { expeditionCrewGame } from "../themes/expedition-crew";
import { CharacterGuessingGame } from "./character-guessing-game";

/** Theme getters stay inside the client module graph, never in server props. */
export function ExpeditionCrewGame() {
  return <CharacterGuessingGame definition={expeditionCrewGame} />;
}
