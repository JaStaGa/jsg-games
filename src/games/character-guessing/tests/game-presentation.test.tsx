import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterGuessingGame } from "../components/character-guessing-game";
import styles from "../components/character-guessing-game.module.css";
import { createCharacterGuessingEngine, onTimeout } from "../logic/session";
import { getGameSummary } from "../logic/game-ui";
import { nbaMvpsGame } from "../themes/nba-mvps";
import { expeditionCrewGame } from "../themes/expedition-crew";
import { copperlightCityGame } from "../themes/copperlight-city";
import type { PlayableCharacterGame } from "../playable";
import type { Session } from "../types";

// Seed only the mounted view for SSR presentation checks; gameplay uses real sessions.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useState: vi.fn(actual.useState) };
});
afterEach(() => vi.clearAllMocks());

function renderSession<Character>(definition: PlayableCharacterGame<Character>, session: Session, nowMs: number) {
  vi.mocked(useState).mockReturnValueOnce([{ session, nowMs }, vi.fn()]);
  // Input and error are empty; seed a submission identity for ranked rendering only.
  vi.mocked(useState).mockReturnValueOnce(["", vi.fn()]);
  vi.mocked(useState).mockReturnValueOnce(["", vi.fn()]);
  vi.mocked(useState).mockReturnValueOnce(["presentation-test", vi.fn()]);
  return renderToStaticMarkup(<CharacterGuessingGame definition={definition} />);
}

describe("game presentation", () => {
  it("widens only comparison themes and preserves discovery title hierarchy", () => {
    const nba = renderToStaticMarkup(<CharacterGuessingGame definition={nbaMvpsGame} />);
    expect(nba).toContain(styles.comparisonGame);
    for (const [name, markup] of [
      [expeditionCrewGame.themeName, renderToStaticMarkup(<CharacterGuessingGame definition={expeditionCrewGame} />)],
      [copperlightCityGame.themeName, renderToStaticMarkup(<CharacterGuessingGame definition={copperlightCityGame} />)],
    ]) {
      expect(markup).not.toContain(styles.comparisonGame);
      expect(markup).toContain("<h1>Character Guessing</h1>");
      expect(markup).toContain(`${name} · 24 characters`);
    }
  });

  function checkSession<Character>(definition: PlayableCharacterGame<Character>) {
    const engine = createCharacterGuessingEngine(definition.theme, () => 0);
    let active = engine.startRound(engine.startSession(0), 0);
    active = engine.submitGuess(active, definition.theme.name(definition.theme.characters[1]), 1);
    const playing = renderSession(definition, active, 1);
    for (const label of ["Score", "Round", "Time left"]) expect(playing).toContain(`<dt>${label}</dt>`);
    expect(playing).toContain('role="timer"');
    expect(playing).not.toContain("Final score");
    if (definition.comparisonColumns) {
      expect(playing).toContain('<option value="LeBron James — 2011-12"');
      expect(playing).toContain('<option value="LeBron James — 2012-13"');
    }
    const terminal = onTimeout(active, 60_000);
    const markup = renderSession(definition, terminal, 60_000);
    for (const label of ["Score", "Round", "Time left"]) expect(markup).not.toContain(`<dt>${label}</dt>`);
    expect(markup).not.toContain('role="timer"');
    for (const label of ["Final score", "Rounds played", "Correctly solved"]) expect(markup.split(`<dt>${label}</dt>`)).toHaveLength(2);
    expect(markup).toContain('id="round-title" tabindex="-1">Time’s up</h2>');
    expect(markup).toContain(getGameSummary(terminal, definition.uiCopy).roundMessage);
    expect(markup).toContain(styles.targetReveal);
    expect(markup).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(markup).toContain(">Play Again</button>");
    expect(markup).not.toMatch(/<details[^>]*\bopen/);
    if (definition.rankedThemeId) expect(markup).toContain("Saving ranked run");
    else expect(markup).not.toContain("Ranked result");
    if (definition.comparisonColumns) {
      expect(markup).toContain('aria-label="Guess comparisons" tabindex="0"');
      expect(markup.indexOf("Final score")).toBeLessThan(markup.indexOf("This round’s comparisons"));
    }
  }
  it("replaces the active NBA HUD with the terminal summary and keeps comparison history", () => checkSession(nbaMvpsGame));
  it("keeps Expedition terminal content and ranked result rendering", () => checkSession(expeditionCrewGame));
  it("keeps Copperlight terminal content and ranked result rendering", () => checkSession(copperlightCityGame));
  it("also removes the HUD when the candidate pool is exhausted", () => {
    const { theme } = nbaMvpsGame;
    const engine = createCharacterGuessingEngine(theme, () => 0);
    let session = engine.startRound(engine.startSession(0), 0);
    for (const candidate of theme.characters) {
      session = engine.submitGuess(session, theme.name(candidate), 1);
      session = engine.startRound(session, 2);
    }
    expect(session.status).toBe("exhausted");
    const markup = renderSession(nbaMvpsGame, session, 2);
    expect(markup).toContain("All characters used</h2>");
    expect(markup).not.toContain('role="timer"');
    expect(markup).not.toContain("<dt>Score</dt>");
    expect(markup).toContain("<dt>Final score</dt><dd>265</dd>");
    expect(markup).toContain("<dt>Rounds played</dt><dd>53</dd>");
    expect(markup).toContain("<dt>Correctly solved</dt><dd>53</dd>");
    expect(markup).toContain(getGameSummary(session).roundMessage);
    expect(markup).toContain(">Play Again</button>");
  });
});
