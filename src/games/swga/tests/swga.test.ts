import { describe, expect, it } from "vitest";

import {
  calculateRoundScore,
  canSubmitGuess,
  createInitialRunState,
  evaluateGuess,
  hasRoundEnded,
  isCorrectGuess,
  isRepeatedGuess,
  isValidAcceptedGuess,
  isValidGuessFormat,
  submitGuess,
} from "../logic/swga";

describe("SWGA game logic", () => {
  it("returns all green feedback for a perfect guess", () => {
    expect(evaluateGuess("apple", "apple")).toEqual([
      "green",
      "green",
      "green",
      "green",
      "green",
    ]);
  });

  it("returns all red feedback when no letters are available", () => {
    expect(evaluateGuess("zzzzz", "apple")).toEqual([
      "red",
      "red",
      "red",
      "red",
      "red",
    ]);
  });

  it("returns yellow feedback for letters that exist in a different position", () => {
    expect(evaluateGuess("stare", "crate")).toEqual([
      "red",
      "yellow",
      "green",
      "yellow",
      "green",
    ]);
  });

  it("handles duplicate letters in the guess without over-awarding yellows", () => {
    expect(evaluateGuess("aabc", "baaa")).toEqual([
      "yellow",
      "green",
      "yellow",
      "red",
    ]);
  });

  it("handles duplicate letters in the answer without over-awarding yellows", () => {
    expect(evaluateGuess("aab", "baa")).toEqual([
      "yellow",
      "green",
      "yellow",
    ]);
  });

  it("normalizes guess and answer case when evaluating feedback", () => {
    expect(evaluateGuess("APPLE", "apple")).toEqual([
      "green",
      "green",
      "green",
      "green",
      "green",
    ]);
  });

  it("returns a single red result for a 1-letter word mismatch", () => {
    expect(evaluateGuess("a", "b")).toEqual(["red"]);
  });

  it("returns yellow feedback for a 2-letter word with swapped letters", () => {
    expect(evaluateGuess("ab", "ba")).toEqual(["yellow", "yellow"]);
  });

  it("returns mixed feedback for a long word with green, yellow, and red results", () => {
    expect(evaluateGuess("abcdefghijklmno", "abcxydfghijklmn")).toEqual([
      "green",
      "green",
      "green",
      "yellow",
      "red",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "yellow",
      "red",
    ]);
  });

  it.each([12, 13, 14, 15, 16, 17, 18, 19, 20])(
    "returns one feedback result for every letter in a %i-letter word",
    (wordLength) => {
      const answer = "abcdefghijklmnopqrst".slice(0, wordLength);

      expect(evaluateGuess(answer, answer)).toEqual(
        Array.from({ length: wordLength }, () => "green"),
      );
    },
  );

  it("returns the correct score for guesses 1 through 6", () => {
    expect(calculateRoundScore(1)).toBe(5);
    expect(calculateRoundScore(2)).toBe(4);
    expect(calculateRoundScore(3)).toBe(3);
    expect(calculateRoundScore(4)).toBe(2);
    expect(calculateRoundScore(5)).toBe(1);
    expect(calculateRoundScore(6)).toBe(0);
  });

  it("returns null for invalid score inputs", () => {
    expect(calculateRoundScore(0)).toBeNull();
    expect(calculateRoundScore(7)).toBeNull();
    expect(calculateRoundScore(1.5)).toBeNull();
  });

  it("validates guess format correctly", () => {
    expect(isValidGuessFormat("apple", 5)).toBe(true);
    expect(isValidGuessFormat("APPLE", 5)).toBe(true);
    expect(isValidGuessFormat("ApPlE", 5)).toBe(true);
    expect(isValidGuessFormat("appl", 5)).toBe(false);
    expect(isValidGuessFormat("app!e", 5)).toBe(false);
    expect(isValidGuessFormat("apple ", 5)).toBe(false);
  });

  it("validates accepted guesses", () => {
    const acceptedGuesses = ["apple", "crane", "spare"];

    expect(isValidAcceptedGuess("apple", acceptedGuesses)).toBe(true);
    expect(isValidAcceptedGuess("APPLE", acceptedGuesses)).toBe(true);
    expect(isValidAcceptedGuess("grape", acceptedGuesses)).toBe(false);
  });

  it("correctly identifies a correct guess", () => {
    expect(isCorrectGuess("apple", "apple")).toBe(true);
    expect(isCorrectGuess("APPLE", "apple")).toBe(true);
    expect(isCorrectGuess("apple", "grape")).toBe(false);
  });

  it("creates the initial run state for round 1", () => {
    const state = createInitialRunState("a");

    expect(state.currentRound).toBe(1);
    expect(state.currentWordLength).toBe(1);
    expect(state.currentAnswer).toBe("a");
    expect(state.guesses).toEqual([]);
    expect(state.totalScore).toBe(0);
    expect(state.highestWordLengthReached).toBe(1);
    expect(state.status).toBe("playing");
  });

  it("updates highestWordLengthReached when advancing from round 1 to round 2", () => {
    const roundOneState = createInitialRunState("a");
    const roundTwoState = submitGuess(roundOneState, "a", ["a"], "to");

    expect(roundTwoState.currentRound).toBe(2);
    expect(roundTwoState.highestWordLengthReached).toBe(2);
  });

  it("updates highestWordLengthReached across multiple round advances", () => {
    let state = createInitialRunState("a");
    state = submitGuess(state, "a", ["a"], "to");
    state = submitGuess(state, "to", ["to"], "too");

    expect(state.currentRound).toBe(3);
    expect(state.highestWordLengthReached).toBe(3);
  });

  it("preserves highestWordLengthReached when a run is lost", () => {
    let state = createInitialRunState("a");
    state = submitGuess(state, "a", ["a"], "to");
    state = submitGuess(state, "to", ["to"], "too");

    state = {
      ...state,
      highestWordLengthReached: 3,
    };

    for (const guess of ["bbb", "ccc", "ddd", "eee", "fff", "ggg"]) {
      state = submitGuess(state, guess, [guess]);
    }

    expect(state.status).toBe("lost");
    expect(state.highestWordLengthReached).toBe(3);
  });

  it("preserves highestWordLengthReached when round 20 is completed", () => {
    const state = {
      ...createInitialRunState("a"),
      currentRound: 20,
      currentWordLength: 20,
      currentAnswer: "abcdefghijklmnopqrst",
      highestWordLengthReached: 20,
    };
    const nextState = submitGuess(state, "abcdefghijklmnopqrst", ["abcdefghijklmnopqrst"]);

    expect(nextState.status).toBe("completed");
    expect(nextState.highestWordLengthReached).toBe(20);
  });

  it("throws when createInitialRunState is given a non-1-letter answer", () => {
    expect(() => createInitialRunState("ab")).toThrowError(
      "Initial run answer must be exactly 1 letter long.",
    );
  });

  it("does not count invalid guesses as attempts", () => {
    const state = createInitialRunState("a");
    const nextState = submitGuess(state, "ab", ["a"]);

    expect(nextState.guesses).toHaveLength(0);
    expect(nextState.totalScore).toBe(0);
    expect(canSubmitGuess(nextState)).toBe(true);
    expect(hasRoundEnded(nextState)).toBe(false);
  });

  it("counts incorrect valid guesses", () => {
    const state = createInitialRunState("a");
    const nextState = submitGuess(state, "b", ["b"]);

    expect(nextState.guesses).toHaveLength(1);
    expect(nextState.guesses[0]?.guess).toBe("b");
    expect(nextState.guesses[0]?.score).toBe(0);
    expect(nextState.totalScore).toBe(0);
  });

  it("rejects an exact duplicate without changing the run state", () => {
    const state = submitGuess(createInitialRunState("a"), "b", ["b"]);
    const nextState = submitGuess(state, "b", ["b"]);

    expect(isRepeatedGuess(state, "b")).toBe(true);
    expect(nextState).toBe(state);
    expect(nextState.guesses).toHaveLength(1);
  });

  it("rejects a case-variant duplicate without counting another attempt", () => {
    const state = submitGuess(createInitialRunState("a"), "b", ["b"]);
    const guessesRemaining = 6 - state.guesses.length;
    const nextState = submitGuess(state, "B", ["b"]);

    expect(isRepeatedGuess(state, "B")).toBe(true);
    expect(nextState).toBe(state);
    expect(6 - nextState.guesses.length).toBe(guessesRemaining);
    expect(nextState.totalScore).toBe(state.totalScore);
  });

  it("adds score for a correct guess", () => {
    const state = {
      ...createInitialRunState("a"),
      currentRound: 20,
      currentWordLength: 1,
      currentAnswer: "a",
    };
    const nextState = submitGuess(state, "a", ["a"]);

    expect(nextState.guesses[0]?.score).toBe(5);
    expect(nextState.totalScore).toBe(5);
    expect(nextState.status).toBe("completed");
  });

  it("advances to the next round after a correct guess when nextAnswer is supplied", () => {
    const state = createInitialRunState("a");
    const nextState = submitGuess(state, "a", ["a"], "ab");

    expect(nextState.currentRound).toBe(2);
    expect(nextState.currentWordLength).toBe(2);
    expect(nextState.currentAnswer).toBe("ab");
    expect(nextState.guesses).toEqual([]);
    expect(nextState.status).toBe("playing");
    expect(nextState.totalScore).toBe(5);
  });

  it("gives 0 points for a sixth correct guess but still advances", () => {
    let state = createInitialRunState("a");

    for (const guess of ["b", "c", "d", "e", "f"]) {
      state = submitGuess(state, guess, [guess]);
    }

    const nextState = submitGuess(state, "a", ["a"], "ab");

    expect(nextState.guesses).toEqual([]);
    expect(nextState.totalScore).toBe(0);
    expect(nextState.currentRound).toBe(2);
    expect(nextState.status).toBe("playing");
  });

  it("completes round 20 when the sixth guess is correct", () => {
    let state = {
      ...createInitialRunState("a"),
      currentRound: 20,
      currentWordLength: 20,
      currentAnswer: "abcdefghijklmnopqrst",
      highestWordLengthReached: 20,
    };

    for (const guess of [
      "bbbbbbbbbbbbbbbbbbbb",
      "cccccccccccccccccccc",
      "dddddddddddddddddddd",
      "eeeeeeeeeeeeeeeeeeee",
      "ffffffffffffffffffff",
    ]) {
      state = submitGuess(state, guess, [guess]);
    }

    const nextState = submitGuess(
      state,
      "abcdefghijklmnopqrst",
      ["abcdefghijklmnopqrst"],
    );

    expect(nextState.status).toBe("completed");
    expect(nextState.guesses).toHaveLength(6);
    expect(nextState.guesses[5]?.score).toBe(0);
    expect(nextState.totalScore).toBe(0);
  });

  it("loses the run after six incorrect guesses", () => {
    let state = createInitialRunState("a");

    for (const guess of ["b", "c", "d", "e", "f", "g"]) {
      state = submitGuess(state, guess, [guess]);
    }

    expect(state.status).toBe("lost");
    expect(state.guesses).toHaveLength(6);
    expect(state.currentAnswer).toBe("a");
    expect(state.guesses[5]?.feedback).toEqual(["red"]);
    expect(canSubmitGuess(state)).toBe(false);
  });

  it("prevents submission once a round already has six guesses", () => {
    const state = {
      ...createInitialRunState("a"),
      guesses: Array.from({ length: 6 }, (_, index) => ({
        guess: "b",
        feedback: [] as Array<"green" | "yellow" | "red">,
        guessNumber: index + 1,
        score: 0,
      })),
    };

    expect(canSubmitGuess(state)).toBe(false);
  });

  it("throws when a correct non-final-round guess has no nextAnswer", () => {
    const state = createInitialRunState("a");

    expect(() => submitGuess(state, "a", ["a"])).toThrowError(
      "nextAnswer is required to advance to the next round",
    );
  });

  it("throws when a correct non-final-round guess has a wrong-length nextAnswer", () => {
    const state = createInitialRunState("a");

    expect(() => submitGuess(state, "a", ["a"], "abc")).toThrowError(
      "nextAnswer must have length 2 for round 2",
    );
  });

  it("resets guesses when advancing to a new round and carries score forward", () => {
    const roundOneState = createInitialRunState("a");
    const roundTwoState = submitGuess(roundOneState, "a", ["a"], "to");
    const roundThreeState = submitGuess(roundTwoState, "to", ["to"], "too");

    expect(roundTwoState.guesses).toEqual([]);
    expect(roundThreeState.currentRound).toBe(3);
    expect(roundThreeState.currentWordLength).toBe(3);
    expect(roundThreeState.currentAnswer).toBe("too");
    expect(roundThreeState.guesses).toEqual([]);
    expect(roundThreeState.totalScore).toBe(10);
  });

  it("marks the run as completed after round 20 is solved", () => {
    const state = {
      ...createInitialRunState("a"),
      currentRound: 20,
      currentWordLength: 5,
      currentAnswer: "apple",
    };
    const nextState = submitGuess(state, "apple", ["apple"]);

    expect(nextState.status).toBe("completed");
    expect(nextState.totalScore).toBe(5);
    expect(hasRoundEnded(nextState)).toBe(true);
  });

  it("prevents further guesses after the run is lost or completed", () => {
    const lostState = {
      ...createInitialRunState("a"),
      status: "lost" as const,
    };
    const completedState = {
      ...createInitialRunState("a"),
      status: "completed" as const,
    };

    expect(canSubmitGuess(lostState)).toBe(false);
    expect(canSubmitGuess(completedState)).toBe(false);
    expect(submitGuess(lostState, "a", ["a"])).toEqual(lostState);
    expect(submitGuess(completedState, "a", ["a"])).toEqual(completedState);
  });
});
