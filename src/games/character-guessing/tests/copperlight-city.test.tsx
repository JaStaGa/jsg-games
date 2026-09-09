import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CharacterGuessingGame } from "../components/character-guessing-game";
import { copperlightCity, residents } from "../data/copperlight-city";
import { copperlightCityGame } from "../themes/copperlight-city";
import { createCharacterGuessingEngine, onTimeout, timeLeft } from "../logic/session";
import { normalizeName } from "../logic/traits";
import { getGameSummary, submitValidatedGuess } from "../logic/game-ui";

const engine = createCharacterGuessingEngine(copperlightCity, () => 0);
const start = () => engine.startRound(engine.startSession(100), 100);
const submit = (session: ReturnType<typeof start>, name: string, nowMs = 101) =>
  submitValidatedGuess(copperlightCity, engine, session, name, nowMs, copperlightCityGame.uiCopy);

describe("Copperlight City production theme", () => {
  it("has at least 20 distinct, populated residents with nested names and useful trait values", () => {
    expect(residents.length).toBeGreaterThanOrEqual(20);
    const names = residents.map((resident) => normalizeName(copperlightCity.name(resident)));
    expect(new Set(names).size).toBe(residents.length);
    expect(names.every(Boolean)).toBe(true);
    for (const resident of residents) {
      expect(resident).not.toHaveProperty("name");
      expect(resident.identity.displayName.trim()).not.toBe("");
      expect(resident.profession.trim()).not.toBe("");
      expect(resident.district.trim()).not.toBe("");
      for (const values of [resident.specialties, resident.affiliations]) {
        expect(values.length).toBeGreaterThanOrEqual(2);
        expect(values.every((value) => value.trim().length > 0)).toBe(true);
        expect(new Set(values).size).toBe(values.length);
      }
    }
  });

  it("configures two exact and two overlap traits", () => {
    expect(copperlightCity.traits.map(({ label, match }) => ({ label, match }))).toEqual([
      { label: "Profession", match: "exact" },
      { label: "District", match: "exact" },
      { label: "Specialties", match: "overlap" },
      { label: "Affiliations", match: "overlap" },
    ]);
    expect(copperlightCityGame.theme).toBe(copperlightCity);
  });

  it("renders nested names and all four guide traits through the unchanged generic UI", () => {
    const markup = renderToStaticMarkup(<CharacterGuessingGame definition={copperlightCityGame} />);
    expect(markup).toContain("Copperlight City · 24 characters");
    expect(markup).toContain("Alda Copperskein");
    expect(markup).toContain("<dt>Profession</dt><dd>Clockmaker</dd>");
    expect(markup).toContain("<dt>District</dt><dd>Lantern Quay</dd>");
    expect(markup).toContain("<dt>Specialties</dt><dd>Gears, Enameling</dd>");
    expect(markup).toContain("<dt>Affiliations</dt><dd>Dawn Guild, Canal Circle</dd>");
    expect(markup).not.toContain("Expedition Crew");
  });

  it("selects targets and discovers exact/overlap hints only once, then scores a normalized guess", () => {
    let session = start();
    expect(session.rounds[0].targetName).toBe("Alda Copperskein");
    expect(timeLeft(session, 100)).toBe(60_000);
    session = submit(session, "Brenna Wickfold").session;
    expect(session.rounds[0].guesses[0].newTraits).toEqual([
      { key: "profession", label: "Profession", values: ["Clockmaker"] },
      { key: "specialties", label: "Specialties", values: ["Gears", "Enameling"] },
    ]);
    session = submit(session, "Cevin Mothwell").session;
    expect(session.rounds[0].guesses[1].newTraits).toEqual([
      { key: "district", label: "District", values: ["Lantern Quay"] },
      { key: "affiliations", label: "Affiliations", values: ["Dawn Guild", "Canal Circle"] },
    ]);
    session = submit(session, " ALDA COPPERSKEIN ").session;
    expect(session.score).toBe(3);
    expect(session.rounds[0].guesses[2].newTraits).toEqual([]);
    expect(getGameSummary(session).hints).toHaveLength(4);
    expect(engine.startRound(session, 102).rounds[1].targetName).toBe("Brenna Wickfold");
  });

  it("rejects blank, unknown and repeated names without consuming attempts", () => {
    let session = start();
    for (const name of ["", " ", "Unknown"]) {
      const result = submit(session, name);
      expect(result.session).toBe(session);
      expect(result.error).not.toBe("");
    }
    session = submit(session, "Brenna Wickfold").session;
    const repeated = submit(session, " BRENNA WICKFOLD ");
    expect(repeated.session).toBe(session);
    expect(repeated.error).toContain("already guessed");
    expect(session.rounds[0].guesses).toHaveLength(1);
  });

  it("reveals after five wrong attempts and progresses with a fresh round", () => {
    let session = start();
    for (const resident of residents.slice(1, 6)) session = submit(session, copperlightCity.name(resident)).session;
    expect(session.score).toBe(0);
    expect(session.rounds[0]).toMatchObject({ status: "exhausted", revealed: true });
    expect(submit(session, "Alda Copperskein").session).toBe(session);
    session = engine.startRound(session, 102);
    expect(session.rounds[1]).toMatchObject({ targetName: "Brenna Wickfold", status: "guessing", guesses: [] });
  });

  it("keeps the deadline through reveals, reveals an unresolved target, and freezes the score", () => {
    let session = submit(start(), "Alda Copperskein").session;
    expect(timeLeft(session, 5_100)).toBe(55_000);
    session = engine.startRound(session, 5_100);
    session = onTimeout(session, 60_100);
    expect(session).toMatchObject({ status: "timed-out", score: 5 });
    expect(session.rounds[1]).toMatchObject({ status: "timed-out", revealed: true, targetName: "Brenna Wickfold" });
    expect(submit(session, "Brenna Wickfold").session).toBe(session);
    expect(engine.startRound(session, 70_000)).toBe(session);
  });

  it("exhausts the whole pool without repetition and replays with fresh state", () => {
    let session = start();
    for (const resident of residents) {
      session = submit(session, copperlightCity.name(resident)).session;
      session = engine.startRound(session, 102);
    }
    expect(session.status).toBe("exhausted");
    expect(new Set(session.rounds.map((round) => round.targetName)).size).toBe(residents.length);
    expect(session.score).toBe(residents.length * 5);
    expect(submit(session, "Alda Copperskein").session).toBe(session);
    expect(start()).toMatchObject({ score: 0, status: "playing" });
    expect(start().rounds[0].guesses).toEqual([]);
  });
});
