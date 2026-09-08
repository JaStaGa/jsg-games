import { describe, expect, it } from "vitest";
import { compareTraits } from "../logic/traits";
import type { TraitDefinition } from "../types";

describe("trait matching", () => {
  const exact: TraitDefinition<string>[] = [{ key: "value", label: "Value", match: "exact", value: (value) => value }];
  const overlap: TraitDefinition<readonly string[]>[] = [{ key: "value", label: "Value", match: "overlap", value: (value) => value }];

  it("normalizes exact values but does not split them or match substrings", () => {
    expect(compareTraits(exact, " BLUE ", "Blue")).toHaveLength(1);
    expect(compareTraits(exact, "Blue", "Blue, Green")).toEqual([]);
    expect(compareTraits(exact, "Blue", "Bluebell")).toEqual([]);
  });

  it("matches whole overlapping values and returns the full target values once", () => {
    expect(compareTraits(overlap, [" GREEN ", "green"], ["Blue", "Green"])).toEqual([
      { key: "value", label: "Value", values: ["Blue", "Green"] },
    ]);
    expect(compareTraits(overlap, ["Blue"], ["Bluebell"])).toEqual([]);
    expect(compareTraits(overlap, ["Red"], ["Blue", "Green"])).toEqual([]);
  });

  it("does not match empty or whitespace-only values", () => {
    expect(compareTraits(exact, " ", "")).toEqual([]);
    expect(compareTraits(overlap, [" "], [""])).toEqual([]);
    expect(compareTraits(overlap, [], [])).toEqual([]);
  });

  it("filters discovered keys without mutating the discovery set", () => {
    const seen = new Set(["value"]);
    expect(compareTraits(exact, "Blue", "Blue", seen)).toEqual([]);
    expect([...seen]).toEqual(["value"]);
  });
});
