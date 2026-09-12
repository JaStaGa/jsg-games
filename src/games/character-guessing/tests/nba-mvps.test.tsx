import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { nbaMvps, nbaMvpSeasons } from "../data/nba-mvps";
import { nbaMvpColumns, nbaMvpsGame } from "../themes/nba-mvps";
import { CharacterGuessingGame } from "../components/character-guessing-game";
import { ComparisonHistory } from "../components/comparison-history";
import { compareColumns, getComparisonRows, validateComparisonColumns } from "../logic/comparison";
import { getGameSummary, submitValidatedGuess } from "../logic/game-ui";
import { createCharacterGuessingEngine, onTimeout, timeLeft } from "../logic/session";
import { buildRankedCharacterSubmission, ensureRankedSubmissionId } from "../logic/ranked-client";
import { normalizeName } from "../logic/traits";

const candidate = (year: number) => nbaMvpSeasons.find((entry) => entry.seasonStartYear === year)!;
const engine = createCharacterGuessingEngine(nbaMvps, () => 0);
const start = () => engine.startRound(engine.startSession(0), 0);
const submit = (session: ReturnType<typeof start>, name: string, nowMs = 1) =>
  submitValidatedGuess(nbaMvps, engine, session, name, nowMs, nbaMvpsGame.uiCopy);

describe("NBA MVP season dataset", () => {
  it("contains precisely the contiguous 53-season scope with unique IDs and normalized player-season names", () => {
    expect(nbaMvpSeasons).toHaveLength(53);
    expect(nbaMvpSeasons.map((entry) => entry.seasonStartYear)).toEqual(Array.from({ length: 53 }, (_, i) => 1973 + i));
    expect(new Set(nbaMvpSeasons.map((entry) => entry.id)).size).toBe(53);
    expect(new Set(nbaMvpSeasons.map((entry) => normalizeName(nbaMvps.name(entry)))).size).toBe(53);
    for (const entry of nbaMvpSeasons) {
      expect(entry.id.trim()).not.toBe("");
      expect(entry.playerName.trim()).not.toBe("");
      expect(entry.team.trim()).not.toBe("");
      expect(entry.season).toBe(`${entry.seasonStartYear}-${String((entry.seasonStartYear + 1) % 100).padStart(2, "0")}`);
      expect(nbaMvps.name(entry)).toBe(`${entry.playerName} — ${entry.season}`);
    }
  });

  it("has finite nonnegative one-decimal statistics and valid regular-season records", () => {
    for (const entry of nbaMvpSeasons) {
      for (const stat of [entry.ppg, entry.rpg, entry.apg, entry.spg, entry.bpg]) {
        expect(Number.isFinite(stat)).toBe(true);
        expect(stat).toBeGreaterThanOrEqual(0);
        expect(stat).toBe(Number(stat.toFixed(1)));
      }
      for (const value of [entry.wins, entry.losses]) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      expect(entry.wins + entry.losses).toBeGreaterThan(0);
      const rate = entry.wins / (entry.wins + entry.losses);
      expect(Number.isFinite(rate)).toBe(true);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThanOrEqual(1);
    }
    expect(() => validateComparisonColumns(nbaMvpColumns, nbaMvpSeasons)).not.toThrow();
  });

  // Independent source pins: Basketball-Reference MVP table and cited team-season pages.
  it.each([
    [1973, "Kareem Abdul-Jabbar", "Milwaukee Bucks", 27.0, 14.5, 4.8, 1.4, 3.5, 59, 23],
    [1974, "Bob McAdoo", "Buffalo Braves", 34.5, 14.1, 2.2, 1.1, 2.1, 49, 33],
    [1975, "Kareem Abdul-Jabbar", "Los Angeles Lakers", 27.7, 16.9, 5.0, 1.5, 4.1, 40, 42],
    [1998, "Karl Malone", "Utah Jazz", 23.8, 9.4, 4.1, 1.3, 0.6, 37, 13],
    [2011, "LeBron James", "Miami Heat", 27.1, 7.9, 6.2, 1.9, 0.8, 46, 20],
    [2015, "Stephen Curry", "Golden State Warriors", 30.1, 5.4, 6.7, 2.1, 0.2, 73, 9],
    [2019, "Giannis Antetokounmpo", "Milwaukee Bucks", 29.5, 13.6, 5.6, 1.0, 1.0, 56, 17],
    [2020, "Nikola Jokić", "Denver Nuggets", 26.4, 10.8, 8.3, 1.3, 0.7, 47, 25],
    [2025, "Shai Gilgeous-Alexander", "Oklahoma City Thunder", 31.1, 4.3, 6.6, 1.4, 0.8, 64, 18],
  ] as const)("pins the researched %s season", (year, playerName, team, ppg, rpg, apg, spg, bpg, wins, losses) => {
    expect(candidate(year)).toMatchObject({ playerName, team, ppg, rpg, apg, spg, bpg, wins, losses });
  });

  it("keeps all four LeBron MVP seasons as distinct candidates", () => {
    const seasons = nbaMvpSeasons.filter((entry) => entry.playerName === "LeBron James");
    expect(seasons.map((entry) => entry.season)).toEqual(["2008-09", "2009-10", "2011-12", "2012-13"]);
    expect(new Set(seasons.map(nbaMvps.name)).size).toBe(4);
  });
});

describe("NBA MVP comparison theme", () => {
  it("configures exactly the eight approved columns in order", () => {
    expect(nbaMvpColumns.map(({ key, label, kind }) => [key, label, kind])).toEqual([
      ["season", "Season", "ordered"], ["team", "Team", "exact"],
      ["ppg", "PPG", "ordered"], ["rpg", "RPG", "ordered"], ["apg", "APG", "ordered"],
      ["spg", "SPG", "ordered"], ["bpg", "BPG", "ordered"], ["team-record", "Team Record", "ordered"],
    ]);
    expect(new Set(nbaMvpColumns.map((column) => column.key)).size).toBe(8);
    expect(nbaMvps.traits).toEqual([]);
  });

  it("points every numeric direction from the guessed season toward the target", () => {
    const cells = compareColumns(nbaMvpColumns, candidate(1973), candidate(2025));
    expect(cells.map((cell) => cell.outcome)).toEqual([
      "target-higher", "different", "target-higher", "target-lower",
      "target-higher", "equal", "target-lower", "target-higher",
    ]);
    expect(cells.map((cell) => cell.display)).toEqual(["1973-74", "Milwaukee Bucks", "27.0", "14.5", "4.8", "1.4", "3.5", "59-23"]);
    expect(compareColumns(nbaMvpColumns, candidate(2025), candidate(1973)).map((cell) => cell.outcome)).toEqual([
      "target-lower", "different", "target-lower", "target-higher",
      "target-lower", "equal", "target-higher", "target-lower",
    ]);
    expect(compareColumns(nbaMvpColumns, candidate(2024), candidate(2025))[1].outcome).toBe("equal");
    expect(compareColumns(nbaMvpColumns, candidate(2025), candidate(2025)).every((cell) => cell.outcome === "equal")).toBe(true);
  });

  it("compares winning percentage instead of raw wins across different season lengths", () => {
    // 37/50 is higher than 47/82, despite fewer wins.
    expect(compareColumns(nbaMvpColumns, candidate(1998), candidate(2016)).at(-1)).toMatchObject({
      display: "37-13", outcome: "target-lower",
    });
    expect(compareColumns(nbaMvpColumns, candidate(2016), candidate(1998)).at(-1)).toMatchObject({
      display: "47-35", outcome: "target-higher",
    });
  });

  it("accepts full labels while treating different seasons by the same player as different guesses", () => {
    const lebronEngine = createCharacterGuessingEngine(nbaMvps, () => 35 / 53);
    let session = lebronEngine.startRound(lebronEngine.startSession(0), 0);
    expect(session.rounds[0].targetName).toBe("LeBron James — 2008-09");
    session = submitValidatedGuess(nbaMvps, lebronEngine, session, " lebron james — 2009-10 ", 1).session;
    expect(session.rounds[0].status).toBe("guessing");
    expect(session.rounds[0].guesses[0].correct).toBe(false);
    session = submitValidatedGuess(nbaMvps, lebronEngine, session, "LeBron James — 2008-09", 2).session;
    expect(session.rounds[0].status).toBe("correct");
    expect(session.score).toBe(4);
  });

  it("rejects blank, unknown, player-only and repeated guesses without consuming attempts", () => {
    const session = submit(start(), nbaMvps.name(candidate(2025))).session;
    for (const name of ["", "Unknown — 2025-26", "LeBron James", " shai gilgeous-alexander — 2025-26 "]) {
      const result = submit(session, name);
      expect(result.session).toBe(session);
      expect(result.error).not.toBe("");
    }
    expect(session.rounds[0].guesses).toHaveLength(1);
  });

  it("renders eight guessed values per row without revealing target values in the feedback", () => {
    let session = submit(start(), nbaMvps.name(candidate(2025))).session;
    session = submit(session, nbaMvps.name(candidate(2024))).session;
    const rows = getComparisonRows(nbaMvps, nbaMvpColumns, session.rounds[0]);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.cells.length === 8)).toBe(true);
    const markup = renderToStaticMarkup(<ComparisonHistory columns={nbaMvpColumns} rows={rows} />);
    for (const text of ["Kareem", "1973-74", "Milwaukee Bucks", "27.0", "14.5", "4.8", "3.5", "59-23"]) expect(markup).not.toContain(text);
    expect(markup).not.toContain("Shared traits");
    expect(markup).toContain("Latest guess");
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain("Target is higher");
    expect(markup).toContain("Target is lower");
    expect(getGameSummary(session, nbaMvpsGame.uiCopy).roundMessage).toBe("Round 1: find the mystery NBA MVP season.");
  });

  it("preserves five attempts, scoring, reveal, row reset, and the original deadline", () => {
    let session = start();
    for (const entry of nbaMvpSeasons.slice(1, 6)) session = submit(session, nbaMvps.name(entry)).session;
    expect(session.rounds[0]).toMatchObject({ status: "exhausted", revealed: true, score: 0 });
    expect(getComparisonRows(nbaMvps, nbaMvpColumns, session.rounds[0])).toHaveLength(5);
    session = engine.startRound(session, 5);
    expect(getComparisonRows(nbaMvps, nbaMvpColumns, session.rounds[1])).toEqual([]);
    expect(session.rounds[1].targetName).toBe(nbaMvps.name(candidate(1974)));
    session = submit(session, nbaMvps.name(candidate(1974)), 6).session;
    expect(session.score).toBe(5);
    expect(session.deadlineMs).toBe(60_000);
    expect(timeLeft(session, 1_000)).toBe(59_000);
    session = engine.startRound(session, 1_000);
    session = onTimeout(session, 60_000);
    expect(session.rounds[2]).toMatchObject({ status: "timed-out", revealed: true });
    expect(submit(session, nbaMvps.name(candidate(1975)), 60_001).session).toBe(session);
  });

  it("never repeats a candidate across rounds and remains unranked at both terminal outcomes", () => {
    const factory = vi.fn();
    expect(nbaMvpsGame).not.toHaveProperty("rankedThemeId");
    expect(ensureRankedSubmissionId(nbaMvpsGame.rankedThemeId, null, factory)).toBeNull();
    expect(factory).not.toHaveBeenCalled();
    let session = start();
    const timeout = onTimeout(session, 60_000);
    for (const entry of nbaMvpSeasons) {
      expect(session.rounds.at(-1)?.targetName).toBe(nbaMvps.name(entry));
      session = submit(session, nbaMvps.name(entry)).session;
      session = engine.startRound(session, 2);
    }
    expect(session.status).toBe("exhausted");
    expect(session.score).toBe(265);
    expect(new Set(session.rounds.map((round) => round.targetName)).size).toBe(53);
    for (const terminal of [session, timeout]) {
      expect(buildRankedCharacterSubmission({ session: terminal, themeId: nbaMvpsGame.rankedThemeId, submissionId: "unused" })).toBeNull();
    }
  });

  it("renders a collapsed guide with all eight formatted values for every candidate", () => {
    const markup = renderToStaticMarkup(<CharacterGuessingGame definition={nbaMvpsGame} />);
    expect(markup).toContain("NBA MVPs · 53 MVP seasons");
    expect(markup).toContain("Practice prototype · unranked");
    expect(markup).toContain("Repeat winners appear more than once");
    expect(markup).not.toMatch(/<details[^>]*\bopen/);
    for (const column of nbaMvpColumns) {
      expect(markup.split(`<dt>${column.label}</dt>`)).toHaveLength(54);
    }
    expect(markup).toContain("<dt>Season</dt><dd>1973-74</dd>");
    expect(markup).toContain("<dt>Team</dt><dd>Buffalo Braves</dd>");
    expect(markup).toContain("<dt>PPG</dt><dd>27.0</dd>");
    expect(markup).toContain("<dt>Team Record</dt><dd>64-18</dd>");
    const guide = markup.slice(markup.indexOf("<details"));
    expect(guide).not.toMatch(/[↑↓✓≠]/);
    expect(guide).not.toContain("Target is higher");
    expect(markup).not.toContain("Ranked result");
  });
});
