import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CandidatePicker } from "../components/candidate-picker";
import { normalizeSearch, resolveCandidateQuery, searchCandidates } from "../logic/candidate-search";
import { createCharacterGuessingEngine } from "../logic/session";
import { submitValidatedGuess } from "../logic/game-ui";
import { nbaMvpsGame } from "../themes/nba-mvps";

const { theme, candidatePicker: picker } = nbaMvpsGame;
const options = theme.characters.map((character) => ({ value: theme.name(character), label: picker!.label(character), detail: picker!.detail(character), searchText: picker!.searchText(character) }));

describe("candidate search", () => {
  it.each([
    ["lebron 12-13", "LeBron James — 2012-13"],
    ["lebron 2012", "LeBron James — 2012-13"],
    ["lebron james 2012", "LeBron James — 2012-13"],
    ["lebron 2012-13", "LeBron James — 2012-13"],
    ["lebron james 2011", "LeBron James — 2011-12"],
    ["jordan 1995", "Michael Jordan — 1995-96"],
    ["jordan 95-96", "Michael Jordan — 1995-96"],
    ["shai 25-26", "Shai Gilgeous-Alexander — 2025-26"],
    ["  LeBRon...  12—13  ", "LeBron James — 2012-13"],
    ["joki 2021", "Nikola Jokić — 2021-22"],
  ])("resolves %s deterministically", (query, expected) => {
    expect(searchCandidates(options, query).map((option) => option.value)).toEqual([expected]);
    expect(resolveCandidateQuery(options, query)).toEqual({ value: expected });
  });
  it("keeps all repeat-winner matches without silently choosing one", () => {
    expect(searchCandidates(options, "lebron").map((option) => option.detail)).toEqual(["2008-09", "2009-10", "2011-12", "2012-13"]);
    expect(searchCandidates(options, "jordan 96").map((option) => option.detail)).toEqual(["1995-96"]);
    // The 1996 MVP was Jordan (1995-96); his next MVP season starts in 1997.
    expect(resolveCandidateQuery(options, "lebron")).toHaveProperty("error");
    expect(normalizeSearch("  LeBron... JAMES—2012-13 ")).toBe("lebron james 2012 13");
    expect(searchCandidates(options, "")).toEqual([]);
  });
  it("keeps unknown and ambiguous queries out of validation and accepts canonical identities", () => {
    const engine = createCharacterGuessingEngine(theme, () => 0);
    let session = engine.startRound(engine.startSession(0), 0);
    for (const query of ["lebron", "missing person", "", "---"]) {
      const resolved = resolveCandidateQuery(options, query);
      expect(resolved.value).toBeUndefined();
      if (resolved.value) session = submitValidatedGuess(theme, engine, session, resolved.value, 1).session;
      expect(session.rounds[0].guesses).toHaveLength(0);
    }
    for (const query of ["LeBron James — 2011-12", "lebron 12-13"]) {
      const resolved = resolveCandidateQuery(options, query);
      expect(resolved.error).toBeUndefined();
      session = submitValidatedGuess(theme, engine, session, resolved.value!, 1).session;
    }
    expect(session.rounds[0].guesses.map((guess) => guess.text)).toEqual(["LeBron James — 2011-12", "LeBron James — 2012-13"]);
    const exact = resolveCandidateQuery(options, " lebron james — 2011-12 ");
    expect(submitValidatedGuess(theme, engine, session, exact.value!, 2).session).toBe(session);
  });
  it("renders a labelled combobox/listbox relationship with no native datalist or initial option dump", () => {
    const markup = renderToStaticMarkup(<CandidatePicker options={options} value="" onChange={() => {}} inputRef={createRef()} placeholder="Search" invalid={false} />);
    expect(markup).toContain('role="combobox" aria-autocomplete="list" aria-expanded="false"');
    const listId = markup.match(/aria-controls="([^"]+)"/)![1];
    expect(markup).toContain(`id="${listId}" role="listbox"`);
    expect(markup).toContain('aria-describedby="guess-help guess-error"');
    expect(markup).not.toContain('role="option"');
    expect(markup).not.toContain("<datalist");
  });
});
