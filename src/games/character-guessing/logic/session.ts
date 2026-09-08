import type { Round, Session, ThemeConfig } from "../types";
import { compareTraits, normalizeName } from "./traits";

export const DEFAULT_DURATION_MS = 60_000;
export const MAX_GUESSES = 5;

export function scoreForRound(guessesUsed: number): number {
  return Number.isInteger(guessesUsed) && guessesUsed >= 1 && guessesUsed <= MAX_GUESSES
    ? MAX_GUESSES + 1 - guessesUsed
    : 0;
}

function requireFiniteTime(nowMs: number): void {
  if (!Number.isFinite(nowMs)) throw new Error("Time must be finite.");
}

export function timeLeft(session: Session, nowMs: number): number {
  requireFiniteTime(nowMs);
  return session.status === "playing"
    ? Math.max(0, Math.min(session.deadlineMs - session.startedAtMs, session.deadlineMs - nowMs))
    : 0;
}

/** Terminal sessions are absorbing, even if a later caller supplies an earlier time. */
export function onTimeout(session: Session, nowMs: number): Session {
  requireFiniteTime(nowMs);
  if (session.status !== "playing" || nowMs < session.deadlineMs) return session;
  return {
    ...session,
    status: "timed-out",
    rounds: session.rounds.map((round, index) =>
      index === session.rounds.length - 1 && round.status === "guessing"
        ? { ...round, status: "timed-out", revealed: true }
        : round,
    ),
  };
}

/** Keep configuration immutable, and use sessions only with the engine that created them. */
export function createCharacterGuessingEngine<Character>(
  config: ThemeConfig<Character>,
  random: () => number = Math.random,
) {
  const characters = new Map<string, Character>();
  for (const character of config.characters) {
    const name = normalizeName(config.name(character));
    if (!name || characters.has(name)) throw new Error("Character names must be nonblank and unique after normalization.");
    characters.set(name, character);
  }
  const keys = config.traits.map((trait) => trait.key);
  if (keys.some((key) => !key.trim()) || new Set(keys).size !== keys.length) {
    throw new Error("Trait keys must be nonblank and unique.");
  }

  function startSession(nowMs: number, durationMs = DEFAULT_DURATION_MS): Session {
    requireFiniteTime(nowMs);
    if (!Number.isFinite(durationMs) || durationMs <= 0 || !Number.isFinite(nowMs + durationMs)) {
      throw new Error("Duration must be positive and produce a finite deadline.");
    }
    return {
      themeId: config.id, startedAtMs: nowMs, deadlineMs: nowMs + durationMs,
      status: "playing", rounds: [], score: 0,
    };
  }

  function startRound(session: Session, nowMs: number): Session {
    const current = onTimeout(session, nowMs);
    if (current.status !== "playing" || current.rounds.at(-1)?.status === "guessing") return current;
    const used = new Set(current.rounds.map((round) => normalizeName(round.targetName)));
    const options = [...characters.keys()].filter((name) => !used.has(name));
    if (options.length === 0) return { ...current, status: "exhausted" };
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error("Random sample must be in [0, 1).");
    const target = characters.get(options[Math.floor(sample * options.length)])!;
    const round: Round = {
      targetName: config.name(target), guesses: [], status: "guessing", revealed: false, score: 0,
    };
    return { ...current, rounds: [...current.rounds, round] };
  }

  function submitGuess(session: Session, text: string, nowMs: number): Session {
    const current = onTimeout(session, nowMs);
    const round = current.rounds.at(-1);
    if (current.status !== "playing" || !round || round.status !== "guessing") return current;
    const correct = normalizeName(text) === normalizeName(round.targetName);
    const guess = characters.get(normalizeName(text));
    const target = characters.get(normalizeName(round.targetName))!;
    const discovered = new Set(round.guesses.flatMap((entry) => entry.newTraits.map((hint) => hint.key)));
    const guesses = [...round.guesses, {
      text, atMs: nowMs, correct,
      newTraits: guess === undefined ? [] : compareTraits(config.traits, guess, target, discovered),
    }];
    const score = correct ? scoreForRound(guesses.length) : 0;
    const status = correct ? "correct" : guesses.length >= MAX_GUESSES ? "exhausted" : "guessing";
    const nextRound: Round = { ...round, guesses, score, status, revealed: status !== "guessing" };
    return {
      ...current,
      rounds: [...current.rounds.slice(0, -1), nextRound],
      score: current.score + score,
    };
  }

  return { startSession, startRound, submitGuess };
}
