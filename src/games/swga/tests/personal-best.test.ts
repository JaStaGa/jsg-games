import { describe, expect, it } from "vitest";
import { currentPersonalBest, exceededPersonalBest, type PersonalBestSnapshot } from "../logic/personal-best";

const before: PersonalBestSnapshot = { revision: "before", userId: "player", result: { status: "known", score: 0 } };
const refresh = { revision: "before", userId: "player", minimumScore: 10 };

describe("personal best synchronization", () => {
  it("treats zero as a known record, with ties excluded", () => {
    expect(exceededPersonalBest(before, "player", 0)).toBe(false);
    expect(exceededPersonalBest(before, "player", 1)).toBe(true);
    expect(exceededPersonalBest(before, "other-player", 20)).toBe(false);
    expect(exceededPersonalBest(null, "player", 20)).toBe(false);
  });
  it("does not promote a successful run from a stale initial read", () => {
    expect(currentPersonalBest(before, refresh)).toEqual({ status: "refreshing" });
  });
  it.each([0, 5])("rejects a fresh aggregate below the confirmed score (%s)", score => {
    expect(currentPersonalBest({ ...before, revision: "after", result: { status: "known", score } }, refresh)).toEqual({ status: "unavailable" });
  });
  it.each(["unavailable", "no-history"] as const)("does not invent a saved best when refresh is %s", status => {
    expect(currentPersonalBest({ ...before, revision: "after", result: { status } }, refresh)).toEqual({ status: "unavailable" });
  });
  it("uses the fresh server maximum as the next run's threshold", () => {
    const after: PersonalBestSnapshot = { ...before, revision: "after", result: { status: "known", score: 30 } };
    expect(currentPersonalBest(after, refresh)).toEqual({ status: "known", score: 30 });
    expect(exceededPersonalBest(after, "player", 20)).toBe(false);
    expect(exceededPersonalBest(after, "player", 30)).toBe(false);
    expect(exceededPersonalBest(after, "player", 35)).toBe(true);
    expect(before.result).toEqual({ status: "known", score: 0 });
  });
  it("never carries the previous account's best into another identity", () => {
    expect(currentPersonalBest({ revision: "after", userId: null, result: { status: "signed-out" } }, refresh)).toEqual({ status: "signed-out" });
  });
});
