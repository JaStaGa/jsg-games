import { describe, expect, it } from "vitest";
import { expeditionCrew } from "../data/expedition-crew";
import { createCharacterGuessingEngine, onTimeout } from "../logic/session";
import { getGameSummary, submitValidatedGuess, validateGuess } from "../logic/game-ui";

const engine = createCharacterGuessingEngine(expeditionCrew, () => 0);
const start = () => engine.startRound(engine.startSession(0), 0);

describe("character-guessing UI boundary", () => {
  it("recognizes known names after trimming and case folding", () => {
    expect(validateGuess(expeditionCrew, start(), "  aVeN tALLoW  ")).toEqual({ name: "Aven Tallow" });
    const result = submitValidatedGuess(expeditionCrew, engine, start(), " AVEN TALLOW ", 1);
    expect(result.error).toBe("");
    expect(result.session.score).toBe(5);
    expect(result.session.rounds[0].guesses[0].text).toBe("Aven Tallow");
  });

  it.each(["", "   ", "Unknown", "Aven"])("rejects %j without an engine attempt", (input) => {
    const session = start();
    const result = submitValidatedGuess(expeditionCrew, engine, session, input, 1);
    expect(result.error).not.toBe("");
    expect(result.session).toBe(session);
    expect(result.session.rounds[0].guesses).toHaveLength(0);
  });

  it("rejects repeated names, including alternate case, without losing an attempt", () => {
    const session = submitValidatedGuess(expeditionCrew, engine, start(), "Bela Wisp", 1).session;
    const result = submitValidatedGuess(expeditionCrew, engine, session, " bela WISP ", 2);
    expect(result.error).toContain("already guessed");
    expect(result.session).toBe(session);
    expect(result.session.rounds[0].guesses).toHaveLength(1);
    expect(submitValidatedGuess(expeditionCrew, engine, session, "Aven Tallow", 3).session.score).toBe(4);
  });

  it("checks the deadline even for invalid input and freezes terminal results", () => {
    const result = submitValidatedGuess(expeditionCrew, engine, start(), "", 60_000);
    expect(result.error).toBe("");
    expect(result.session.status).toBe("timed-out");
    expect(result.session.rounds[0].guesses).toHaveLength(0);
    expect(submitValidatedGuess(expeditionCrew, engine, result.session, "Aven Tallow", 1).session).toBe(result.session);
  });
});

describe("display summaries from engine state", () => {
  it("summarizes an active round without leaking its target", () => {
    const summary = getGameSummary(start());
    expect(summary).toMatchObject({ finished: false, canGuess: true, canAdvance: false, roundsPlayed: 1, solved: 0, hints: [] });
    expect(summary.roundMessage).not.toContain("Aven Tallow");
  });

  it("summarizes a solved round and accumulated discoveries", () => {
    let session = engine.submitGuess(start(), "Bela Wisp", 1);
    session = engine.submitGuess(session, "Aven Tallow", 2);
    const summary = getGameSummary(session);
    expect(summary).toMatchObject({ canGuess: false, canAdvance: true, solved: 1, finished: false });
    expect(summary.roundMessage).toBe("Correct! Aven Tallow. 4 points earned.");
    expect(summary.hints.map((hint) => hint.key)).toEqual(["role", "skills", "region"]);
    const next = getGameSummary(engine.startRound(session, 3));
    expect(next).toMatchObject({ roundsPlayed: 2, solved: 1, hints: [], canGuess: true });
  });

  it("summarizes five incorrect attempts and allows progression", () => {
    let session = start();
    for (const member of expeditionCrew.characters.slice(1, 6)) {
      session = submitValidatedGuess(expeditionCrew, engine, session, member.name, 1).session;
    }
    const summary = getGameSummary(session);
    expect(summary).toMatchObject({ canGuess: false, canAdvance: true, solved: 0, finished: false });
    expect(summary.roundMessage).toContain("Aven Tallow. 0 points earned.");
    expect(summary.round?.guesses).toHaveLength(5);
    expect(submitValidatedGuess(expeditionCrew, engine, session, "Aven Tallow", 2).session).toBe(session);
  });

  it("reveals an unresolved target at timeout with final round statistics", () => {
    let session = engine.submitGuess(start(), "Aven Tallow", 1);
    session = engine.startRound(session, 2);
    const summary = getGameSummary(onTimeout(session, 60_000));
    expect(summary).toMatchObject({ headline: "Time’s up", finished: true, canGuess: false, canAdvance: false, roundsPlayed: 2, solved: 1 });
    expect(summary.roundMessage).toBe("The target was Bela Wisp.");
  });

  it("keeps the session clock running after a round is solved", () => {
    const session = engine.submitGuess(start(), "Aven Tallow", 1);
    const summary = getGameSummary(onTimeout(session, 60_000));
    expect(summary).toMatchObject({ headline: "Time’s up", canAdvance: false, solved: 1 });
    expect(summary.roundMessage).toContain("5 points earned");
  });

  it("summarizes pool exhaustion and a completely fresh replay", () => {
    let session = start();
    for (const member of expeditionCrew.characters) {
      session = engine.submitGuess(session, member.name, 1);
      session = engine.startRound(session, 2);
    }
    expect(getGameSummary(session)).toMatchObject({ headline: "All characters used", finished: true, canAdvance: false, roundsPlayed: 24, solved: 24 });
    expect(session.score).toBe(120);
    const fresh = start();
    expect(fresh.score).toBe(0);
    expect(getGameSummary(fresh)).toMatchObject({ roundsPlayed: 1, solved: 0, hints: [], canGuess: true });
    expect(fresh.rounds[0].guesses).toEqual([]);
  });
});
