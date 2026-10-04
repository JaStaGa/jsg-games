import { describe, expect, it } from "vitest";

import answers05 from "../data/answers/05.json";
import answers06 from "../data/answers/06.json";
import answers07 from "../data/answers/07.json";
import {
  getAcceptedGuessesForWordLength,
  getAnswerForRound,
  getInitialAnswer,
} from "../data/wordData";
import { isValidAcceptedGuess, submitGuess, type RunState } from "../logic/swga";

describe("word data", () => {
  it("selects the first answer for a random value near zero", () => {
    expect(getAnswerForRound(5, () => 0)).toBe(answers05[0]);
  });

  it("selects the final answer for a random value near one", () => {
    expect(getAnswerForRound(5, () => 0.999999999)).toBe(
      answers05[answers05.length - 1],
    );
  });

  it("selects an answer with the correct length", () => {
    expect(getAnswerForRound(11, () => 0.5)).toHaveLength(11);
  });

  it("returns undefined for invalid round numbers", () => {
    expect(getAnswerForRound(0, () => 0)).toBeUndefined();
    expect(getAnswerForRound(21, () => 0)).toBeUndefined();
  });

  it("always returns a valid one-letter initial answer", () => {
    expect(getInitialAnswer(() => 0.5)).toHaveLength(1);
  });
});

describe("seven-letter accepted guesses", () => {
  const accepted = getAcceptedGuessesForWordLength(7);

  it("contains exactly 1,715 unique entries", () => {
    expect(accepted).toHaveLength(1715);
    expect(new Set(accepted).size).toBe(1715);
  });

  it("contains only lowercase seven-letter ASCII words in alphabetical order", () => {
    expect(accepted.every((word) => /^[a-z]{7}$/.test(word))).toBe(true);
    expect(accepted).toEqual([...accepted].sort());
  });

  it("accepts all 92 answers and preserves their selection order", () => {
    expect(answers07).toHaveLength(92);
    answers07.forEach((answer, index) => {
      expect(isValidAcceptedGuess(answer, accepted)).toBe(true);
      expect(getAnswerForRound(7, () => (index + 0.5) / answers07.length)).toBe(answer);
    });
    expect(getAnswerForRound(7, () => 0)).toBe(answers07[0]);
    expect(getAnswerForRound(7, () => 0.999999999)).toBe(answers07[91]);
  });

  it.each([
    "badging", "balling", "calling", "gallery", "grumble",
    "running", "signage", "stinker", "stumble", "whither",
  ])("accepts the new word %s regardless of case", (word) => {
    expect(isValidAcceptedGuess(word, accepted)).toBe(true);
    expect(isValidAcceptedGuess(word.toUpperCase(), accepted)).toBe(true);
    expect(isValidAcceptedGuess(word[0].toUpperCase() + word.slice(1), accepted)).toBe(true);
    expect(answers07).not.toContain(word);
  });

  it("keeps representative held words excluded", () => {
    for (const word of ["alabama", "firefox", "samsung", "livecam", "sitemap", "spyware", "telecom"]) {
      expect(isValidAcceptedGuess(word, accepted)).toBe(false);
    }
  });

  it("allows a new guess through submission without changing scoring or progression", () => {
    const state: RunState = {
      currentRound: 7,
      currentWordLength: 7,
      currentAnswer: "ability",
      guesses: [],
      totalScore: 30,
      highestWordLengthReached: 7,
      status: "playing",
    };
    const guessed = submitGuess(state, "BADGING", accepted);
    expect(guessed).toEqual({
      ...state,
      guesses: [{
        guess: "badging",
        feedback: ["yellow", "yellow", "red", "red", "green", "red", "red"],
        guessNumber: 1,
        score: 0,
      }],
    });
    const nextAnswer = getAnswerForRound(8, () => 0);
    const solved = submitGuess(guessed, "ability", accepted, nextAnswer);
    expect(solved).toEqual({
      currentRound: 8,
      currentWordLength: 8,
      currentAnswer: nextAnswer,
      guesses: [],
      totalScore: 34,
      highestWordLengthReached: 8,
      status: "playing",
    });
  });

  it("preserves six- and nine-letter counts and validation for other lengths", () => {
    expect(getAcceptedGuessesForWordLength(6)).toHaveLength(1548);
    expect(getAcceptedGuessesForWordLength(9)).toHaveLength(249);
    for (let length = 1; length <= 20; length += 1) {
      if (length === 7) continue;
      const pool = getAcceptedGuessesForWordLength(length);
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every((word) => word.length === length)).toBe(true);
      expect(isValidAcceptedGuess(getAnswerForRound(length, () => 0.5)!, pool)).toBe(true);
      expect(isValidAcceptedGuess("badging", pool)).toBe(false);
    }
  });
});

describe("six-letter accepted guesses", () => {
  const accepted = getAcceptedGuessesForWordLength(6);

  it("contains exactly 1,548 unique entries", () => {
    expect(accepted).toHaveLength(1548);
    expect(new Set(accepted).size).toBe(1548);
  });

  it("contains only lowercase six-letter ASCII words in alphabetical order", () => {
    expect(accepted.every((word) => /^[a-z]{6}$/.test(word))).toBe(true);
    expect(accepted).toEqual([...accepted].sort());
  });

  it("accepts all 110 six-letter answers and preserves their selection order", () => {
    expect(answers06).toHaveLength(110);
    answers06.forEach((answer, index) => {
      expect(isValidAcceptedGuess(answer, accepted)).toBe(true);
      expect(getAnswerForRound(6, () => (index + 0.5) / answers06.length)).toBe(answer);
    });
  });

  it.each(["abduct", "called", "easier", "monkey", "phones", "sports", "zoning"])(
    "accepts the new word %s regardless of case",
    (word) => {
      expect(isValidAcceptedGuess(word, accepted)).toBe(true);
      expect(isValidAcceptedGuess(word.toUpperCase(), accepted)).toBe(true);
      expect(isValidAcceptedGuess(word[0].toUpperCase() + word.slice(1), accepted)).toBe(true);
      expect(answers06).not.toContain(word);
    },
  );

  it("keeps representative deferred entries excluded", () => {
    for (const word of ["aidful", "amazon", "baddie", "dinger", "cheque", "kernel", "router", "webcam"]) {
      expect(isValidAcceptedGuess(word, accepted)).toBe(false);
    }
  });

  it("allows a new guess through submission without changing scoring or progression", () => {
    const state: RunState = {
      currentRound: 6,
      currentWordLength: 6,
      currentAnswer: "accept",
      guesses: [],
      totalScore: 25,
      highestWordLengthReached: 6,
      status: "playing",
    };
    const guessed = submitGuess(state, "ABDUCT", accepted);
    expect(guessed.guesses).toEqual([{
      guess: "abduct",
      feedback: ["green", "red", "red", "red", "yellow", "green"],
      guessNumber: 1,
      score: 0,
    }]);
    expect(guessed.totalScore).toBe(25);
    expect(guessed.currentRound).toBe(6);
    expect(guessed.status).toBe("playing");
    const solved = submitGuess(guessed, "accept", accepted, getAnswerForRound(7, () => 0));
    expect(solved.totalScore).toBe(29);
    expect(solved.currentRound).toBe(7);
    expect(solved.currentWordLength).toBe(7);
  });

  it("keeps other word lengths valid and excludes six-letter guesses from them", () => {
    for (let length = 1; length <= 20; length += 1) {
      if (length === 6) continue;
      const pool = getAcceptedGuessesForWordLength(length);
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every((word) => word.length === length)).toBe(true);
      expect(isValidAcceptedGuess(getAnswerForRound(length, () => 0.5)!, pool)).toBe(true);
      expect(isValidAcceptedGuess("abduct", pool)).toBe(false);
    }
    expect(getAcceptedGuessesForWordLength(0)).toEqual([]);
    expect(getAcceptedGuessesForWordLength(21)).toEqual([]);
  });
});
