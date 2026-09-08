import { describe, expect, it } from "vitest";
import { createCharacterGuessingEngine, onTimeout, scoreForRound, timeLeft } from "../logic/session";
import { explorers, residents } from "./fixtures";

const engine = createCharacterGuessingEngine(residents, () => 0);
const start = (durationMs?: number) => engine.startRound(engine.startSession(1_000, durationMs), 1_000);

describe("character-guessing session", () => {
  it.each([1, 2, 3, 4, 5])("awards the expected score for success on attempt %i", (attempt) => {
    let session = start();
    for (let i = 1; i < attempt; i++) session = engine.submitGuess(session, "unknown", 1_001);
    session = engine.submitGuess(session, "Alice", 1_002);
    expect(session.score).toBe(6 - attempt);
    expect(session.rounds[0]).toMatchObject({ status: "correct", revealed: true, score: 6 - attempt });
    expect(session.rounds[0].guesses).toHaveLength(attempt);
    expect(engine.submitGuess(session, "Alice", 1_003)).toBe(session);
  });

  it.each([0, 6, -1, 1.5, NaN, Infinity])("gives no score for invalid attempt %s", (attempt) => {
    expect(scoreForRound(attempt)).toBe(0);
  });

  it("uses the default duration and a configurable deadline", () => {
    expect(timeLeft(start(), 1_000)).toBe(60_000);
    expect(timeLeft(start(8_000), 3_000)).toBe(6_000);
    expect(timeLeft(start(), 0)).toBe(60_000);
    expect(timeLeft(start(), 80_000)).toBe(0);
  });

  it("counts unknown, blank and repeated incorrect guesses; stops at five", () => {
    let session = start();
    for (const text of ["unknown", "", "Bob", "Bob"]) {
      session = engine.submitGuess(session, text, 1_001);
      expect(session.rounds[0].status).toBe("guessing");
      expect(session.score).toBe(0);
    }
    session = engine.submitGuess(session, "wrong", 1_002);
    expect(session.rounds[0]).toMatchObject({ status: "exhausted", revealed: true, score: 0 });
    expect(session.rounds[0].guesses).toHaveLength(5);
    expect(session.rounds[0].guesses.every((guess) => !guess.correct)).toBe(true);
    expect(engine.submitGuess(session, "Alice", 1_003)).toBe(session);
    const next = engine.startRound(session, 1_004);
    expect(next.rounds).toHaveLength(2);
    expect(next.rounds[1].guesses).toEqual([]);
    expect(next.score).toBe(0);
  });

  it("requires a round and prevents skipping an unresolved round", () => {
    const empty = engine.startSession(1_000);
    expect(engine.submitGuess(empty, "Alice", 1_001)).toBe(empty);
    const session = start();
    expect(engine.startRound(session, 1_001)).toBe(session);
  });

  it("accumulates scores, never repeats targets and terminates after pool exhaustion", () => {
    let session = start();
    session = engine.submitGuess(session, "Alice", 1_001);
    session = engine.startRound(session, 1_002);
    session = engine.submitGuess(session, "wrong", 1_003);
    session = engine.submitGuess(session, "Bob", 1_004);
    expect(session.score).toBe(9);
    session = engine.startRound(session, 1_005);
    session = engine.submitGuess(session, "Carol", 1_006);
    session = engine.startRound(session, 1_007);
    expect(session.rounds.map((round) => round.targetName)).toEqual(["Alice", "Bob", "Carol"]);
    expect(session.status).toBe("exhausted");
    expect(session.score).toBe(14);
    expect(engine.startRound(session, 1_008)).toBe(session);
    expect(engine.submitGuess(session, "Carol", 1_008)).toBe(session);
    expect(onTimeout(session, 99_000)).toBe(session);
  });

  it.each(["  aLiCe  ", "ALICE", "alice\n"])("normalizes name %j", (text) => {
    const session = engine.submitGuess(start(), text, 1_001);
    expect(session.rounds[0].guesses[0]).toMatchObject({ text, atMs: 1_001, correct: true });
    expect(session.score).toBe(5);
  });

  it("does not perform fuzzy or partial name matching", () => {
    expect(engine.submitGuess(start(), "Ali", 1_001).score).toBe(0);
  });

  it.each(["tick", "guess", "next"])("enforces timeout at the deadline via %s", (action) => {
    let session = engine.submitGuess(start(10), "Alice", 1_001);
    session = engine.startRound(session, 1_002);
    const before = session;
    const snapshot = JSON.stringify(before);
    session = action === "guess" ? engine.submitGuess(session, "Bob", 1_010)
      : action === "next" ? engine.startRound(session, 1_010) : onTimeout(session, 1_010);
    expect(session.status).toBe("timed-out");
    expect(session.score).toBe(5);
    expect(session.rounds[1]).toMatchObject({ status: "timed-out", revealed: true, guesses: [], score: 0 });
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(engine.submitGuess(session, "Bob", 1_003)).toBe(session);
    expect(engine.startRound(session, 1_003)).toBe(session);
    expect(onTimeout(session, 1_003)).toBe(session);
    expect(timeLeft(session, 1_003)).toBe(0);
  });

  it("accepts a guess just before expiry and preserves completed rounds on timeout", () => {
    const session = engine.submitGuess(start(10), "Alice", 1_009);
    expect(onTimeout(session, 1_009)).toBe(session);
    const ended = onTimeout(session, 9_000);
    expect(ended.score).toBe(5);
    expect(ended.rounds[0]).toBe(session.rounds[0]);
    expect(ended.status).toBe("timed-out");
  });

  it("can time out before a round starts", () => {
    const session = onTimeout(engine.startSession(0), 60_000);
    expect(session).toMatchObject({ status: "timed-out", score: 0, rounds: [] });
  });

  it("does not mutate prior state when submitting a guess or progressing", () => {
    const original = start();
    Object.freeze(original.rounds[0].guesses);
    Object.freeze(original.rounds[0]);
    Object.freeze(original.rounds);
    Object.freeze(original);
    const solved = engine.submitGuess(original, "Alice", 1_001);
    const next = engine.startRound(solved, 1_002);
    expect(original.rounds[0].guesses).toEqual([]);
    expect(original.score).toBe(0);
    expect(solved.rounds).toHaveLength(1);
    expect(next.rounds).toHaveLength(2);
  });

  it("uses injected randomness to select from the remaining targets", () => {
    const last = createCharacterGuessingEngine(residents, () => 0.999);
    let session = last.startRound(last.startSession(0), 0);
    expect(session.rounds[0].targetName).toBe("Carol");
    session = last.submitGuess(session, "Carol", 1);
    expect(last.startRound(session, 2).rounds[1].targetName).toBe("Bob");
  });

  it("handles an empty target pool without sampling randomness", () => {
    const empty = createCharacterGuessingEngine({ ...residents, characters: [] }, () => { throw new Error("Must not sample"); });
    expect(empty.startRound(empty.startSession(0), 0)).toMatchObject({ status: "exhausted", score: 0, rounds: [] });
  });

  it.each([0, -1, NaN, Infinity])("rejects invalid duration %s", (duration) => {
    expect(() => start(duration)).toThrow("Duration");
  });

  it("rejects invalid time and randomness", () => {
    expect(() => engine.startSession(NaN)).toThrow("Time");
    expect(() => engine.submitGuess(start(), "Alice", Infinity)).toThrow("Time");
    for (const value of [-1, 1, NaN, Infinity]) {
      const invalid = createCharacterGuessingEngine(residents, () => value);
      expect(() => invalid.startRound(invalid.startSession(0), 0)).toThrow("Random");
    }
  });

  it("rejects ambiguous names and trait keys", () => {
    expect(() => createCharacterGuessingEngine({ ...residents, characters: [...residents.characters, { name: " ALICE ", job: "", town: "" }] })).toThrow("unique");
    expect(() => createCharacterGuessingEngine({ ...residents, characters: [{ name: " ", job: "", town: "" }] })).toThrow("nonblank");
    expect(() => createCharacterGuessingEngine({ ...residents, traits: [residents.traits[0], residents.traits[0]] })).toThrow("Trait keys");
  });
});

describe("two distinct configurations using the same engine", () => {
  it("discovers exact traits only once per round and resets discoveries for the next target", () => {
    let session = engine.submitGuess(start(), " BOB ", 1_001);
    expect(session.rounds[0].guesses[0].newTraits).toEqual([{ key: "job", label: "Job", values: ["Baker"] }]);
    session = engine.submitGuess(session, "Bob", 1_002);
    expect(session.rounds[0].guesses[1].newTraits).toEqual([]);
    session = engine.submitGuess(session, "Carol", 1_003);
    expect(session.rounds[0].guesses[2].newTraits.map((hint) => hint.key)).toEqual(["town"]);
    session = engine.submitGuess(session, "Alice", 1_004);
    expect(session.score).toBe(2);
    session = engine.startRound(session, 1_005);
    session = engine.submitGuess(session, "Alice", 1_006);
    expect(session.rounds[1].guesses[0].newTraits.map((hint) => hint.key)).toEqual(["job"]);
  });

  it("handles a different data shape with mixed overlap and exact traits", () => {
    const mixed = createCharacterGuessingEngine(explorers, () => 0);
    let session = mixed.startRound(mixed.startSession(0, 5_000), 0);
    session = mixed.submitGuess(session, "Eli", 1);
    expect(session.rounds[0].guesses[0].newTraits).toEqual([{ key: "skills", label: "Skills", values: ["Sailing", "Mapping"] }]);
    session = mixed.submitGuess(session, "Fern", 2);
    expect(session.rounds[0].guesses[1].newTraits.map((hint) => hint.key)).toEqual(["rank"]);
    session = mixed.submitGuess(session, " DARA ", 3);
    expect(session.score).toBe(3);
    session = mixed.startRound(session, 4);
    expect(session.rounds[1].targetName).toBe("Eli");
    expect(onTimeout(session, 5_000)).toMatchObject({ status: "timed-out", score: 3 });
  });
});
