import { describe, expect, it } from "vitest";
import { gameRegistry } from "./registry";

describe("game registry", () => {
  it("registers Character Guessing exactly once at its playable route", () => {
    const matches = gameRegistry.filter((game) => game.slug === "character-guessing");
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ name: "Character Guessing", href: "/games/character-guessing" });
    expect(gameRegistry.filter((game) => game.href === "/games/character-guessing")).toHaveLength(1);
  });
  it("registers SWGA at its playable route", () => {
    expect(gameRegistry).toContainEqual({
      slug: "swga",
      name: "SWGA",
      summary: "A word-guessing run that grows from one letter to twenty.",
      href: "/games/swga",
    });
  });
});
