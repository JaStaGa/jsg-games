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
      expect(playing).toContain('role="combobox"');
      expect(playing).not.toContain("<datalist");
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
  it("keeps full comparison feedback in one polite live region and only a concise visible message", () => {
    const engine = createCharacterGuessingEngine(nbaMvpsGame.theme, () => 0);
    const session = engine.submitGuess(engine.startRound(engine.startSession(0), 0), "LeBron James — 2011-12", 1);
    const markup = renderSession(nbaMvpsGame, session, 1);
    const status = markup.match(/<p[^>]*role="status"[^>]*>([\s\S]*?)<\/p>/)![1];
    expect(status).toContain('<span aria-hidden="true">LeBron James — 2011-12 is not the target.</span>');
    const hidden = status.match(new RegExp(`<span class="${styles.visuallyHidden}">([\\s\\S]*?)</span>`))![1];
    for (const label of ["Season", "Team", "PPG", "RPG", "APG", "SPG", "BPG", "Team Record"]) expect(hidden).toContain(`${label}:`);
    expect(status.replace(/<span class="[^"]+">[\s\S]*?<\/span>/, "")).not.toMatch(/Season:|PPG:|Team Record:/);
    expect(markup.match(/role="status"/g)).toHaveLength(1);
  });
  it("puts Start Game before collapsed comparison instructions only", () => {
    const nba = renderToStaticMarkup(<CharacterGuessingGame definition={nbaMvpsGame} />);
    expect(nba.indexOf("Start Game")).toBeLessThan(nba.indexOf("How to play"));
    expect(nba).toMatch(/<details[^>]*><summary>How to play<\/summary><ul/);
    expect(nba).not.toMatch(/<details[^>]*\bopen/);
    for (const markup of [
      renderToStaticMarkup(<CharacterGuessingGame definition={expeditionCrewGame} />),
      renderToStaticMarkup(<CharacterGuessingGame definition={copperlightCityGame} />),
    ]) {
      expect(markup).not.toContain("How to play");
      expect(markup.indexOf("five attempts")).toBeLessThan(markup.indexOf("Start Game"));
    }
  });
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
