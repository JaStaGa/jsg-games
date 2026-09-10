import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CharacterGuessingPage from "@/app/games/character-guessing/expedition-crew/page";
import Home from "@/app/page";
import { gameRegistry } from "@/games/registry";
import { CharacterGuessingGame } from "../components/character-guessing-game";
import { ExpeditionCrewGame } from "../components/expedition-crew-game";
import { expeditionCrew } from "../data/expedition-crew";
import { getGameSummary, submitValidatedGuess } from "../logic/game-ui";
import { createCharacterGuessingEngine } from "../logic/session";
import type { PlayableCharacterGame } from "../playable";
import { expeditionCrewGame } from "../themes/expedition-crew";
import { copperlightCityGame } from "../themes/copperlight-city";
import { RankedResult } from "../components/ranked-result";
import type { RankedSubmissionAttempt } from "../logic/ranked-client";

// Test-only shape: not even a top-level `name` property is required by the UI.
type Visitor = { identity: { label: string }; habitat: string; affinities: readonly string[] };
const visitors: PlayableCharacterGame<Visitor> = {
  theme: {
    id: "test-visitors",
    characters: [
      { identity: { label: "Nim" }, habitat: "Orchard", affinities: ["Wind", "Rain"] },
      { identity: { label: "Pella" }, habitat: "Orchard", affinities: ["Rain", "Sun"] },
    ],
    name: (character) => character.identity.label,
    traits: [
      { key: "habitat", label: "Habitat", match: "exact", value: (character) => character.habitat },
      { key: "affinities", label: "Affinities", match: "overlap", value: (character) => character.affinities },
    ],
  },
  title: "Visitor Guessing",
  themeName: "Garden Visitors",
  subtitle: "Find a mysterious visitor.",
  introTitle: "A garden mystery",
  introDescription: "Use the character guide to interpret your clues.",
  traitInstructions: "Habitat matches exactly; affinities can overlap.",
  inputHelp: "Choose a character name from the guide.",
  guideTitle: "Character guide",
  guideDescription: "Meet the garden visitors.",
};

describe("playable theme boundary", () => {
  it("opts in only production themes through approved IDs without database metadata", () => {
    expect(expeditionCrewGame.rankedThemeId).toBe("expedition-crew");
    expect(copperlightCityGame.rankedThemeId).toBe("copperlight-city");
    expect(visitors.rankedThemeId).toBeUndefined();
    for (const definition of [expeditionCrewGame, copperlightCityGame, visitors]) {
      expect(definition).not.toHaveProperty("gameSlug");
      expect(definition).not.toHaveProperty("gameId");
    }
    expect(renderToStaticMarkup(<CharacterGuessingGame definition={visitors} />)).not.toContain("Ranked result");
  });

  it.each([
    ["saving", "Saving ranked run"], ["saved", "Ranked run saved"],
    ["authentication-required", 'href="/login"'], ["profile-required", 'href="/profile"'],
    ["conflict", "conflicts with an earlier submission"], ["retryable-error", ">Retry</button>"],
  ] as const)("renders accessible %s ranked feedback", (status, expected) => {
    const attempt: RankedSubmissionAttempt = {
      status, payload: { submissionId: "test", themeId: "expedition-crew", score: 0, outcome: "timed-out", roundsPlayed: 1, solved: 0 },
    };
    const markup = renderToStaticMarkup(<RankedResult attempt={attempt} onRetry={() => {}} />);
    expect(markup).toContain(expected);
    expect(markup).toContain('aria-live="polite"');
    if (status !== "retryable-error") expect(markup).not.toContain(">Retry</button>");
  });
  it("supplies the existing production config and presentation metadata", () => {
    expect(expeditionCrewGame.theme).toBe(expeditionCrew);
    expect(expeditionCrewGame).toMatchObject({ title: "Character Guessing", themeName: "Expedition Crew", guideTitle: "Crew guide · names & traits" });
    expect(expeditionCrewGame.guideDescription).toContain("All 24 crew members");
    const markup = renderToStaticMarkup(<ExpeditionCrewGame />);
    expect(markup).toContain("Expedition Crew · 24 characters");
    expect(markup).toContain("One crew. Sixty seconds.");
    expect(markup).toContain(expeditionCrewGame.traitInstructions);
    expect(markup).toContain("Start Game");
  });

  it("keeps the server route prop-free and binds config inside the client wrapper", () => {
    const route = CharacterGuessingPage();
    expect(route.type).toBe(ExpeditionCrewGame);
    expect(route.props).toEqual({});
    const wrapper = ExpeditionCrewGame();
    expect(wrapper.type).toBe(CharacterGuessingGame);
    expect(wrapper.props.definition).toBe(expeditionCrewGame);
  });

  it("renders a differently shaped theme with configuration-driven exact and overlap guide values", () => {
    const markup = renderToStaticMarkup(<CharacterGuessingGame definition={visitors} />);
    expect(markup).toContain("Garden Visitors · 2 characters");
    expect(markup).toContain("Visitor Guessing");
    expect(markup).toContain("Character guide");
    expect(markup).toContain("Nim");
    expect(markup).toContain("Pella");
    expect(markup).toContain("<dt>Habitat</dt><dd>Orchard</dd>");
    expect(markup).toContain("<dt>Affinities</dt><dd>Wind, Rain</dd>");
    expect(markup).not.toMatch(/crew|Role|Region|Skills|24 characters/i);
  });

  it("uses neutral helper defaults and the same validation, matching and scoring for the alternate shape", () => {
    const engine = createCharacterGuessingEngine(visitors.theme, () => 0);
    let session = engine.startRound(engine.startSession(0), 0);
    expect(getGameSummary(session).roundMessage).toBe("Round 1: find the mystery character.");
    expect(getGameSummary(session).headline).toBe("Find the character");
    for (const input of ["", "Unknown"]) {
      const rejected = submitValidatedGuess(visitors.theme, engine, session, input, 1);
      expect(rejected.session).toBe(session);
      expect(rejected.error).not.toMatch(/crew/i);
      expect(rejected.error).not.toBe("");
    }
    session = submitValidatedGuess(visitors.theme, engine, session, " PELLA ", 2).session;
    expect(getGameSummary(session).hints).toEqual([
      { key: "habitat", label: "Habitat", values: ["Orchard"] },
      { key: "affinities", label: "Affinities", values: ["Wind", "Rain"] },
    ]);
    const repeated = submitValidatedGuess(visitors.theme, engine, session, "pella", 3);
    expect(repeated.session).toBe(session);
    expect(repeated.error).toContain("already guessed");
    session = submitValidatedGuess(visitors.theme, engine, session, " nim ", 4).session;
    expect(session.score).toBe(4);
    expect(getGameSummary(session)).toMatchObject({ solved: 1, canAdvance: true });
  });

  it("preserves Expedition Crew's public validation and active-round wording", () => {
    const { theme, uiCopy } = expeditionCrewGame;
    const engine = createCharacterGuessingEngine(theme, () => 0);
    const session = engine.startRound(engine.startSession(0), 0);
    expect(getGameSummary(session, uiCopy)).toMatchObject({ headline: "Find the crew member", roundMessage: "Round 1: find the mystery crew member." });
    const result = submitValidatedGuess(theme, engine, session, "Unknown", 1, uiCopy);
    expect(result.error).toBe("Choose a name from the crew list.");
    expect(result.session).toBe(session);
  });

  it("keeps exactly the existing routes and homepage game count", () => {
    expect(gameRegistry.map((game) => game.href).sort()).toEqual(["/games/character-guessing", "/games/swga"]);
    expect(renderToStaticMarkup(<Home />)).toContain("2 games available.");
  });
});
