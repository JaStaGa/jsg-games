"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { expeditionCrew } from "../data/expedition-crew";
import { createCharacterGuessingEngine, MAX_GUESSES, onTimeout, timeLeft } from "../logic/session";
import { getGameSummary, submitValidatedGuess } from "../logic/game-ui";
import type { Session } from "../types";
import styles from "./character-guessing-game.module.css";

const engine = createCharacterGuessingEngine(expeditionCrew);

export function CharacterGuessingGame() {
  const [view, setView] = useState<{ session: Session; nowMs: number } | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  // Event handlers and timer callbacks always use the latest engine state.
  const sessionRef = useRef<Session | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const session = view?.session;
  const summary = session ? getGameSummary(session) : null;
  const running = session?.status === "playing";

  function publish(next: Session, nowMs: number) {
    sessionRef.current = next;
    setView({ session: next, nowMs });
  }

  useEffect(() => {
    if (!running) return;
    function refresh() {
      const current = sessionRef.current;
      if (!current) return;
      const nowMs = performance.now();
      const next = onTimeout(current, nowMs);
      sessionRef.current = next;
      setView({ session: next, nowMs });
    }
    const interval = window.setInterval(refresh, 100);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [running]);

  useEffect(() => {
    if (summary?.finished) resultsRef.current?.focus();
    else if (summary?.canAdvance) nextRef.current?.focus();
    else if (summary?.canGuess) inputRef.current?.focus();
  }, [summary?.finished, summary?.canAdvance, summary?.canGuess, summary?.roundsPlayed]);

  function start() {
    const nowMs = performance.now();
    publish(engine.startRound(engine.startSession(nowMs), nowMs), nowMs);
    setInput("");
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = sessionRef.current;
    if (!current) return;
    const nowMs = performance.now();
    const result = submitValidatedGuess(expeditionCrew, engine, current, input, nowMs);
    publish(result.session, nowMs);
    setError(result.error);
    if (!result.error) setInput("");
    inputRef.current?.focus();
  }

  function nextRound() {
    const current = sessionRef.current;
    if (!current) return;
    const nowMs = performance.now();
    publish(engine.startRound(current, nowMs), nowMs);
    setInput("");
    setError("");
  }

  const lastGuess = summary?.round?.guesses.at(-1);
  const guessFeedback = lastGuess && !lastGuess.correct
    ? `${lastGuess.text} is not the target. ${lastGuess.newTraits.length
      ? lastGuess.newTraits.map((hint) => `${hint.label}: ${hint.values.join(", ")}`).join(". ")
      : "No new shared traits."}` : "";

  return (
    <main className={styles.page}>
      <div className={styles.game}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Expedition Crew · 24 characters</p>
          <h1>Character Guessing</h1>
          <p>Meet a mystery crew member. Let shared traits point the way.</p>
        </header>

        {!session ? (
          <section className={styles.panel} aria-labelledby="start-title">
            <h2 id="start-title">One crew. Sixty seconds.</h2>
            <p>Guess a name to uncover matching traits. Use the crew guide below to narrow your next guess.</p>
            <ul className={styles.instructions}>
              <li>You have five attempts per character. Solve earlier to earn more: 5, 4, 3, 2 or 1 point.</li>
              <li>Role and Region match exactly. A shared Skill reveals the target’s full skill list.</li>
              <li>Choose Next Round after a reveal. The 60-second clock keeps running between rounds.</li>
            </ul>
            <button className={styles.button} onClick={start}>Start Game</button>
          </section>
        ) : summary && view && (
          <>
            <dl className={styles.hud}>
              <div><dt>Score</dt><dd>{session.score}</dd></div>
              <div><dt>Round</dt><dd>{summary.roundsPlayed}</dd></div>
              <div><dt>Time left</dt><dd role="timer" aria-live="off">{Math.ceil(timeLeft(session, view.nowMs) / 1_000)}s</dd></div>
            </dl>

            <section className={styles.panel} aria-labelledby="round-title">
              <h2 id="round-title" ref={resultsRef} tabIndex={-1}>{summary.headline}</h2>
              <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
                {summary.roundMessage}{summary.canGuess && guessFeedback ? ` ${guessFeedback}` : ""}
              </p>

              {summary.finished ? (
                <>
                  <dl className={styles.results}>
                    <div><dt>Final score</dt><dd>{session.score}</dd></div>
                    <div><dt>Rounds played</dt><dd>{summary.roundsPlayed}</dd></div>
                    <div><dt>Correctly solved</dt><dd>{summary.solved}</dd></div>
                  </dl>
                  <button className={styles.button} onClick={start}>Play Again</button>
                </>
              ) : summary.canAdvance ? (
                <>
                  <p className={styles.muted}>The clock is still running.</p>
                  <button className={styles.button} onClick={nextRound} ref={nextRef}>Next Round</button>
                </>
              ) : (
                <form onSubmit={submit} autoComplete="off">
                  <div className={styles.formLabel}>
                    <label htmlFor="crew-guess">Character name</label>
                    <span>{summary.round?.guesses.length ?? 0} / {MAX_GUESSES} attempts used</span>
                  </div>
                  <div className={styles.inputRow}>
                    <input id="crew-guess" ref={inputRef} value={input} onChange={(event) => { setInput(event.target.value); setError(""); }}
                      list="crew-names" placeholder="Type or select a name" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                      aria-describedby="guess-help guess-error" aria-invalid={!!error} />
                    <button type="submit" className={styles.button}>Guess</button>
                  </div>
                  <datalist id="crew-names">{expeditionCrew.characters.map((character) => <option key={character.name} value={character.name} />)}</datalist>
                  <p id="guess-help" className={styles.muted}>Use a crew name you haven’t guessed this round. Press Enter to submit.</p>
                  <p id="guess-error" className={styles.error} role="alert">{error}</p>
                </form>
              )}

              <div className={styles.evidence}>
                <section aria-labelledby="hints-title">
                  <h3 id="hints-title">Shared traits</h3>
                  {summary.hints.length ? <dl className={styles.hints}>{summary.hints.map((hint) => (
                    <div key={hint.key}><dt>{hint.label}</dt><dd>{hint.values.join(", ")}</dd></div>
                  ))}</dl> : <p className={styles.muted}>No shared traits discovered yet.</p>}
                </section>
                <section aria-labelledby="history-title">
                  <h3 id="history-title">This round’s guesses</h3>
                  {summary.round?.guesses.length ? <ol className={styles.history}>{summary.round.guesses.map((guess) => (
                    <li key={guess.text}><strong>{guess.text}</strong><span>{guess.correct ? "Correct" : "Incorrect"}</span></li>
                  ))}</ol> : <p className={styles.muted}>Your first guess starts the trail.</p>}
                </section>
              </div>
            </section>
          </>
        )}

        <details className={styles.guide}>
          <summary>Crew guide · names &amp; traits</summary>
          <p className={styles.muted}>All 24 crew members are listed here. Compare their traits with your clues. Opening the guide does not pause a running game.</p>
          <ul className={styles.crewList}>{expeditionCrew.characters.map((character) => (
            <li key={character.name}>
              <h3>{character.name}</h3>
              <dl>{expeditionCrew.traits.map((trait) => (
                <div key={trait.key}><dt>{trait.label}</dt><dd>{trait.match === "overlap" ? trait.value(character).join(", ") : trait.value(character)}</dd></div>
              ))}</dl>
            </li>
          ))}</ul>
        </details>
      </div>
    </main>
  );
}
