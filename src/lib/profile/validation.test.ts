import { describe, expect, it } from "vitest";
import { USERNAME_ERROR_MESSAGE, validateUsername } from "./validation";

describe("validateUsername", () => {
  it("trims surrounding whitespace and preserves capitalization", () => {
    expect(validateUsername("  Player_One  ")).toEqual({
      success: true,
      username: "Player_One",
    });
  });

  it.each(["abc", "Player123", "A_b", "Z".repeat(20)])(
    "accepts the approved username %s",
    (username) => {
      expect(validateUsername(username)).toEqual({ success: true, username });
    },
  );

  const invalidUsernames: Array<[unknown, string]> = [
    [null, "a non-string value"],
    ["   ", "a whitespace-only value"],
    ["ab", "a value shorter than three characters"],
    ["a".repeat(21), "a value longer than twenty characters"],
    ["_player", "a leading underscore"],
    ["player one", "spaces"],
    ["player-one", "punctuation"],
  ];

  it.each(invalidUsernames)("rejects %s (%s)", (input) => {
    expect(validateUsername(input)).toEqual({
      success: false,
      fieldErrors: { username: USERNAME_ERROR_MESSAGE },
    });
  });
});
