import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ComparisonHistory } from "../components/comparison-history";
import { CharacterGuessingGame } from "../components/character-guessing-game";
import { compareColumns, getComparisonRows, validateComparisonColumns } from "../logic/comparison";
import { submitValidatedGuess } from "../logic/game-ui";
import { createCharacterGuessingEngine, onTimeout } from "../logic/session";
import { buildRankedCharacterSubmission } from "../logic/ranked-client";
import type { ComparisonColumn } from "../playable";
import { comparisonGame } from "./fixtures";
import styles from "../components/character-guessing-game.module.css";

const { theme, comparisonColumns: columns } = comparisonGame;
const [willow, birch, cedar] = theme.characters;

describe("comparison feedback", () => {
  it("keeps symbols visible and outcome meanings visually hidden with semantic outcome classes", () => {
    const rows = [birch, cedar].map((guess) => ({ name: theme.name(guess), correct: false, cells: compareColumns(columns, guess, willow) }));
    const markup = renderToStaticMarkup(<ComparisonHistory columns={columns} rows={rows} />);
    const cells = [...markup.matchAll(/<td class="([^"]+)">([\s\S]*?)<\/td>/g)];
    const expected = [
      ["✓", "Match", styles.comparisonEqual],
      ["↑", "Target is higher", styles.comparisonDirection],
      ["↓", "Target is lower", styles.comparisonDirection],
      ["≠", "Different", styles.comparisonDifferent],
      ["↓", "Target is lower", styles.comparisonDirection],
      ["✓", "Match", styles.comparisonEqual],
    ];
    expect(cells).toHaveLength(expected.length);
    cells.forEach(([, className, content], index) => {
      const [symbol, label, outcomeClass] = expected[index];
      expect(className.split(" ")).toContain(outcomeClass);
      expect(content).toContain(`<span aria-hidden="true">${symbol}</span>`);
      const hidden = `<span class="${styles.visuallyHidden}">. ${label}.</span>`;
      expect(content).toContain(hidden);
      expect(content.replace(hidden, "")).not.toMatch(/Target is higher|Target is lower|Match|Different/);
    });
    expect(markup).not.toContain("<small");
    expect(markup).toContain("Arrows point from your guess toward the mystery target.");
    expect(markup).not.toContain("Scroll the table");
  });

  it("returns every column in order with normalized exact equality and directions toward the target", () => {
    expect(compareColumns(columns, birch, willow)).toEqual([
      { key: "category", label: "Category", display: " craft ", outcome: "equal" },
      { key: "capacity", label: "Capacity", display: "25.0", outcome: "target-higher" },
      { key: "record", label: "Workshop record", display: "20-10", outcome: "target-lower" },
    ]);
    expect(compareColumns(columns, cedar, willow).map((cell) => cell.outcome)).toEqual(["different", "target-lower", "equal"]);
    expect(compareColumns(columns, willow, willow).every((cell) => cell.outcome === "equal")).toBe(true);
  });

  it("supports exact display formatting independently of equality", () => {
    const exact: ComparisonColumn<string>[] = [{ key: "x", label: "X", kind: "exact", value: (x) => x, display: () => "Formatted" }];
    expect(compareColumns(exact, " CRAFT ", "craft")[0]).toMatchObject({ display: "Formatted", outcome: "equal" });
  });

  it("does not mutate candidates, columns, or configuration", () => {
    const guess = Object.freeze({ ...birch, identity: Object.freeze({ ...birch.identity }) });
    const target = Object.freeze({ ...willow, identity: Object.freeze({ ...willow.identity }) });
    const frozenColumns = Object.freeze(columns.map((column) => Object.freeze({ ...column })));
    const before = JSON.stringify([guess, target, frozenColumns]);
    validateComparisonColumns(frozenColumns, Object.freeze([guess, target]));
    compareColumns(frozenColumns, guess, target);
    expect(JSON.stringify([guess, target, frozenColumns])).toBe(before);
  });

  it.each([NaN, Infinity, -Infinity])("rejects non-finite values (%s) in either candidate and before play", (capacity) => {
    const invalid = { ...willow, capacity };
    expect(() => compareColumns(columns, invalid, birch)).toThrow("finite numeric");
    expect(() => compareColumns(columns, birch, invalid)).toThrow("finite numeric");
    expect(() => validateComparisonColumns(columns, [birch, invalid])).toThrow("finite numeric");
    expect(() => renderToStaticMarkup(<CharacterGuessingGame definition={{ ...comparisonGame, theme: { ...theme, characters: [invalid] } }} />)).toThrow("finite numeric");
  });

  it("rejects empty, duplicate, and blank column keys", () => {
    for (const invalid of [[], [columns[0], columns[0]], [{ ...columns[0], key: " " }]]) {
      expect(() => validateComparisonColumns(invalid, theme.characters)).toThrow("keys");
    }
  });

  it("keeps full rows for valid guesses, rejects invalid/duplicate guesses, and resets only on progression", () => {
    const engine = createCharacterGuessingEngine(theme, () => 0);
    let session = engine.startRound(engine.startSession(0), 0);
    expect(getComparisonRows(theme, columns, session.rounds[0])).toEqual([]);
    for (const name of [" BIRCH ", "Cedar"]) session = submitValidatedGuess(theme, engine, session, name, 1).session;
    for (const name of ["", "Unknown", "birch"]) expect(submitValidatedGuess(theme, engine, session, name, 2).session).toBe(session);
    const rows = getComparisonRows(theme, columns, session.rounds[0]);
    expect(rows.map((row) => row.name)).toEqual(["Birch", "Cedar"]);
    expect(rows.every((row) => row.cells.length === columns.length)).toBe(true);
    const markup = renderToStaticMarkup(<ComparisonHistory columns={columns} rows={rows} />);
    for (const text of ["Match", "Target is higher", "Target is lower", "Different", "Latest guess", 'scope="col"', 'scope="row"', 'tabindex="0"']) expect(markup).toContain(text);
    expect(markup).not.toContain("Willow");
    expect(markup).not.toContain("30.0");
    expect(markup).not.toContain("Shared traits");
    expect(getComparisonRows(theme, columns, onTimeout(session, 60_000).rounds[0])).toEqual(rows);
    session = submitValidatedGuess(theme, engine, session, "Willow", 3).session;
    expect(session.score).toBe(3);
    expect(session.deadlineMs).toBe(60_000);
    expect(getComparisonRows(theme, columns, session.rounds[0])[2]).toMatchObject({ name: "Willow", correct: true });
    expect(getComparisonRows(theme, columns, session.rounds[0])[2].cells.every((cell) => cell.outcome === "equal")).toBe(true);
    session = engine.startRound(session, 4);
    expect(session.rounds[1].targetName).toBe("Birch");
    expect(getComparisonRows(theme, columns, session.rounds[1])).toEqual([]);
    expect(buildRankedCharacterSubmission({ session: onTimeout(session, 60_000), themeId: undefined, submissionId: null })).toBeNull();
  });
});
