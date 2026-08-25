import { describe, expect, it } from "vitest";

import answers05 from "../data/answers/05.json";
import { getAnswerForRound, getInitialAnswer } from "../data/wordData";

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
