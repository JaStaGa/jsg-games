import { describe, expect, it } from "vitest";
import { crew, expeditionCrew } from "../data/expedition-crew";
import { createCharacterGuessingEngine } from "../logic/session";
import { normalizeName } from "../logic/traits";

describe("production Expedition Crew", () => {
  it("has at least 20 unique, nonblank names and complete original trait data", () => {
    expect(crew.length).toBeGreaterThanOrEqual(20);
    const names = crew.map((character) => normalizeName(character.name));
    expect(names.every(Boolean)).toBe(true);
    expect(new Set(names).size).toBe(crew.length);
    for (const member of crew) {
      expect(member.role.trim()).not.toBe("");
      expect(member.region.trim()).not.toBe("");
      expect(member.skills.length).toBeGreaterThan(1);
      expect(member.skills.every((skill) => skill.trim())).toBe(true);
    }
    expect(expeditionCrew.traits.map((trait) => trait.match)).toEqual(["exact", "exact", "overlap"]);
  });

  it("uses the shared engine for exact traits, overlap traits, hints and scoring", () => {
    const engine = createCharacterGuessingEngine(expeditionCrew, () => 0);
    let session = engine.startRound(engine.startSession(100), 100);
    expect(session.deadlineMs).toBe(60_100);
    expect(session.rounds[0].targetName).toBe("Aven Tallow");
    session = engine.submitGuess(session, "Bela Wisp", 101);
    expect(session.rounds[0].guesses[0].newTraits).toEqual([
      { key: "role", label: "Role", values: ["Navigator"] },
      { key: "skills", label: "Skills", values: ["Mapping", "Sailing"] },
    ]);
    session = engine.submitGuess(session, "Caro Brindle", 102);
    expect(session.rounds[0].guesses[1].newTraits).toEqual([
      { key: "region", label: "Region", values: ["Mistfen"] },
    ]);
    session = engine.submitGuess(session, "Aven Tallow", 103);
    expect(session.score).toBe(3);
    expect(session.rounds[0].guesses[2].newTraits).toEqual([]);
  });
});
