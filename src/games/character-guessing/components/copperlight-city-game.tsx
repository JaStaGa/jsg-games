"use client";

import { copperlightCityGame } from "../themes/copperlight-city";
import { CharacterGuessingGame } from "./character-guessing-game";

export function CopperlightCityGame() {
  return <CharacterGuessingGame definition={copperlightCityGame} />;
}
