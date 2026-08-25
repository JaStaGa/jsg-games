import { describe, expect, it } from "vitest";
import { gameRegistry } from "./registry";

describe("game registry", () => {
  it("registers SWGA at its playable route", () => {
    expect(gameRegistry).toContainEqual({
      slug: "swga",
      name: "SWGA",
      summary: "A word-guessing run that grows from one letter to twenty.",
      href: "/games/swga",
    });
  });
});
