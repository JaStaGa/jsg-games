import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ThemeSelectionPage, { metadata as familyMetadata } from "@/app/games/character-guessing/page";
import ExpeditionCrewPage, { metadata as crewMetadata } from "@/app/games/character-guessing/expedition-crew/page";
import CopperlightCityPage, { metadata as cityMetadata } from "@/app/games/character-guessing/copperlight-city/page";
import Home from "@/app/page";
import { gameRegistry } from "@/games/registry";
import { ExpeditionCrewGame } from "../components/expedition-crew-game";
import { CopperlightCityGame } from "../components/copperlight-city-game";
import { CharacterGuessingGame } from "../components/character-guessing-game";
import { copperlightCityGame } from "../themes/copperlight-city";
import { characterThemes } from "../themes/catalog";

describe("character theme discovery and routes", () => {
  it("exposes exactly two unique themes with serializable route metadata and native links", () => {
    expect(characterThemes.map((theme) => theme.id)).toEqual(["expedition-crew", "copperlight-city"]);
    expect(new Set(characterThemes.map((theme) => theme.href)).size).toBe(2);
    expect(JSON.parse(JSON.stringify(characterThemes))).toEqual(characterThemes);
    const markup = renderToStaticMarkup(<ThemeSelectionPage />);
    expect(markup.match(/<a\s/g)).toHaveLength(2);
    expect(markup).toContain('href="/games/character-guessing/expedition-crew"');
    expect(markup).toContain('href="/games/character-guessing/copperlight-city"');
    expect(markup).toContain("Play Expedition Crew");
    expect(markup).toContain("Play Copperlight City");
  });

  it("keeps the family as one of exactly two homepage games", () => {
    expect(gameRegistry).toHaveLength(2);
    const family = gameRegistry.filter((game) => game.slug === "character-guessing");
    expect(family).toHaveLength(1);
    expect(family[0].href).toBe("/games/character-guessing");
    expect(family[0].summary).not.toMatch(/Expedition|Copperlight/);
    expect(gameRegistry.map((game) => game.slug).sort()).toEqual(["character-guessing", "swga"]);
    const home = renderToStaticMarkup(<Home />);
    expect(home).toContain("2 games available.");
    expect(home).toContain('href="/games/character-guessing"');
  });

  it("renders each prop-free client wrapper from its direct server route", () => {
    expect(ExpeditionCrewPage().type).toBe(ExpeditionCrewGame);
    expect(ExpeditionCrewPage().props).toEqual({});
    expect(CopperlightCityPage().type).toBe(CopperlightCityGame);
    expect(CopperlightCityPage().props).toEqual({});
    expect(CopperlightCityGame().type).toBe(CharacterGuessingGame);
    expect(CopperlightCityGame().props.definition).toBe(copperlightCityGame);
  });

  it("provides distinct, appropriate route metadata", () => {
    expect(familyMetadata.title).toBe("Character Guessing | JSG Games");
    expect(crewMetadata.title).toContain("Expedition Crew");
    expect(cityMetadata.title).toContain("Copperlight City");
    for (const metadata of [familyMetadata, crewMetadata, cityMetadata]) expect(metadata.description).toBeTruthy();
  });
});
