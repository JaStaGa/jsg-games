import type { Session, ThemeConfig } from "../types";
import { onTimeout } from "./session";
import { normalizeName } from "./traits";

/** UI policy only: the shared engine intentionally still accepts free text. */
export function validateGuess<Character>(
  config: ThemeConfig<Character>, session: Session, input: string,
): { name: string; error?: never } | { error: string; name?: never } {
  const normalized = normalizeName(input);
  if (!normalized) return { error: "Enter a character name." };
  const character = config.characters.find((item) => normalizeName(config.name(item)) === normalized);
  if (!character) return { error: "Choose a name from the crew list." };
  if (session.rounds.at(-1)?.guesses.some((guess) => normalizeName(guess.text) === normalized)) {
    return { error: "You already guessed that character this round." };
  }
  return { name: config.name(character).trim() };
}

export function submitValidatedGuess<Character>(
  config: ThemeConfig<Character>,
  engine: { submitGuess: (session: Session, name: string, nowMs: number) => Session },
  session: Session, input: string, nowMs: number,
): { session: Session; error: string } {
  const current = onTimeout(session, nowMs);
  if (current.status !== "playing" || current.rounds.at(-1)?.status !== "guessing") {
    return { session: current, error: "" };
  }
  const result = validateGuess(config, current, input);
  if (result.error !== undefined) return { session: current, error: result.error };
  return { session: engine.submitGuess(current, result.name, nowMs), error: "" };
}

export function getGameSummary(session: Session) {
  const round = session.rounds.at(-1);
  const finished = session.status !== "playing";
  const roundMessage = !round ? "Ready for a round."
    : round.status === "correct" ? `Correct! ${round.targetName}. ${round.score} points earned.`
    : round.status === "exhausted" ? `No attempts left. The target was ${round.targetName}. 0 points earned.`
    : round.status === "timed-out" ? `The target was ${round.targetName}.`
    : `Round ${session.rounds.length}: find the mystery crew member.`;
  return {
    round,
    finished,
    canGuess: !finished && round?.status === "guessing",
    canAdvance: !finished && !!round && round.status !== "guessing",
    headline: session.status === "timed-out" ? "Time’s up"
      : session.status === "exhausted" ? "All characters used" : "Find the crew member",
    roundMessage,
    roundsPlayed: session.rounds.length,
    solved: session.rounds.filter((item) => item.status === "correct").length,
    hints: round?.guesses.flatMap((guess) => guess.newTraits) ?? [],
  };
}
