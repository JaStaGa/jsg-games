"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  getAcceptedGuessesForWordLength,
  getAnswerForRound,
  getInitialAnswer,
} from "../data/wordData";
import {
  buildBoardRows,
  buildKeyboardState,
  isEditableGuessChange,
  type BoardRow,
  type KeyboardKeyState,
} from "../logic/game-ui";
import {
  beginRankedSubmission,
  buildRankedSwgaSubmission,
  ensureRankedSubmissionId,
  settleRankedSubmission,
  submitRankedSwgaRun,
  type RankedSubmissionAttempt,
  type SwgaGameMode,
} from "../logic/ranked-client";
import type { RankedSwgaSubmission } from "../logic/ranked-submission";
import {
  canSubmitGuess,
  createInitialRunState,
  isCorrectGuess,
  isRepeatedGuess,
  isValidAcceptedGuess,
  isValidGuessFormat,
  submitGuess,
  type GuessFeedback,
  type RunState,
} from "../logic/swga";
import {
  createTimerDeadline,
  formatRemainingTime,
  getRemainingTimeMs,
  hasTimerExpired,
  TIMED_RUN_DURATION_MS,
} from "../logic/timer";
import styles from "./swga-game.module.css";

const feedbackLabels: Record<GuessFeedback, string> = {
  green: "right letter, right place",
  yellow: "right letter, wrong place",
  red: "letter not in the answer",
};

const keyboardStateLabels: Record<KeyboardKeyState, string> = {
  unused: "not tried",
  absent: "not in the answer",
  yellow: "in the answer, wrong place",
  green: "in the correct place",
};

const keyboardRows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const neutralStatusMessage = "Enter a guess for the current round.";
const timerUpdateIntervalMs = 250;
const feedbackFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSdXA0arb0sArJe9NkLg1Tf2ogFnA1V-5rvs68L2YtNAEH6MoQ/viewform?usp=publish-editor";

function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter(Boolean).join(" ");
}

function getBoardRowLabel(row: BoardRow): string {
  if (row.kind === "submitted") {
    const feedbackDescription = row.cells
      .map(
        (cell) =>
          `${cell.letter.toUpperCase()}, ${cell.feedback ? feedbackLabels[cell.feedback] : "no feedback"}`,
      )
      .join("; ");
    return `Guess ${row.guessNumber}: ${feedbackDescription}`;
  }

  if (row.kind === "current") {
    const guess = row.cells
      .map((cell) => cell.letter.toUpperCase() || "blank")
      .join(", ");
    return `Guess ${row.guessNumber}, current guess: ${guess}`;
  }

  return `Guess ${row.guessNumber}, empty`;
}

function RankedSubmissionStatus({
  attempt,
  onRetry,
}: {
  attempt: RankedSubmissionAttempt;
  onRetry: () => void;
}) {
  let content;

  switch (attempt.status) {
    case "saving":
      content = <p>Saving ranked run…</p>;
      break;
    case "saved":
      content = <p>Ranked run saved.</p>;
      break;
    case "authentication-required":
      content = (
        <p>
          This ranked run could not be saved because sign-in is required.{" "}
          <Link href="/login">Sign in</Link>
        </p>
      );
      break;
    case "profile-required":
      content = (
        <p>
          This ranked run could not be saved because a player profile is
          required.{" "}
          <Link href="/profile">Set up your profile</Link>
        </p>
      );
      break;
    case "conflict":
      content = (
        <p>
          This ranked run could not be saved because it conflicts with an
          earlier submission.
        </p>
      );
      break;
    case "retryable-error":
      content = (
        <>
          <p>We couldn&apos;t save this ranked run.</p>
          <button
            type="button"
            className={classNames(
              styles.secondaryButton,
              styles.rankedRetryButton,
            )}
            onClick={onRetry}
          >
            Retry
          </button>
        </>
      );
      break;
  }

  return (
    <div className={styles.rankedStatus} aria-live="polite">
      <span className={styles.rankedStatusLabel}>Ranked result</span>
      {content}
    </div>
  );
}

export function SwgaGame() {
  const [runState, setRunState] = useState<RunState>(() =>
    createInitialRunState(getInitialAnswer()),
  );
  const [guessInput, setGuessInput] = useState("");
  const [statusMessage, setStatusMessage] = useState(neutralStatusMessage);
  const [statusTone, setStatusTone] = useState<
    "info" | "success" | "warning"
  >("info");
  const [gameMode, setGameMode] = useState<SwgaGameMode>("untimed");
  const [timerDeadlineMs, setTimerDeadlineMs] = useState<number | null>(null);
  const timerDeadlineRef = useRef<number | null>(null);
  const [remainingTimeMs, setRemainingTimeMs] = useState(
    TIMED_RUN_DURATION_MS,
  );
  const [timedOut, setTimedOut] = useState(false);
  const [hasGameplayStarted, setHasGameplayStarted] = useState(false);
  const [rankedSubmissionId, setRankedSubmissionId] = useState<string | null>(
    null,
  );
  const [rankedSubmissionAttempt, setRankedSubmissionAttempt] =
    useState<RankedSubmissionAttempt | null>(null);
  const automaticallySubmittedIds = useRef(new Set<string>());

  const currentAcceptedGuesses = useMemo(
    () =>
      Array.from(
        new Set([
          runState.currentAnswer,
          ...getAcceptedGuessesForWordLength(runState.currentWordLength),
        ]),
      ),
    [runState.currentAnswer, runState.currentWordLength],
  );
  const guessesRemaining = Math.max(0, 6 - runState.guesses.length);
  const canSubmit = canSubmitGuess(runState);
  const boardRows = buildBoardRows(
    runState.guesses,
    guessInput,
    runState.currentWordLength,
  );
  const keyboardState = buildKeyboardState(runState.guesses);
  const letterLabel = runState.currentWordLength === 1 ? "letter" : "letters";
  const isTimedMode = gameMode === "timed";
  const isRunActive = runState.status === "playing" && !timedOut;
  const formattedRemainingTime = formatRemainingTime(remainingTimeMs);
  const modeSelectionLocked =
    hasGameplayStarted ||
    runState.guesses.length > 0 ||
    runState.currentRound > 1 ||
    timerDeadlineMs !== null;
  const boardStyle = {
    "--board-max-width": `${runState.currentWordLength * 48 + Math.max(0, runState.currentWordLength - 1) * 5}px`,
    "--word-length": runState.currentWordLength,
    "--tile-font-size": `${Math.max(0.55, Math.min(1.2, 11 / runState.currentWordLength))}rem`,
  } as CSSProperties;
  const terminalRankedSubmission = useMemo(
    () =>
      buildRankedSwgaSubmission({
        gameMode,
        timedGameplayStarted: timerDeadlineMs !== null,
        timedOut,
        submissionId: rankedSubmissionId,
        runState,
      }),
    [
      gameMode,
      rankedSubmissionId,
      runState,
      timedOut,
      timerDeadlineMs,
    ],
  );
  const displayedRankedAttempt = terminalRankedSubmission
    ? rankedSubmissionAttempt?.payload.submissionId ===
      terminalRankedSubmission.submissionId
      ? rankedSubmissionAttempt
      : beginRankedSubmission(terminalRankedSubmission)
    : null;

  const sendRankedSubmission = useCallback(
    (payload: RankedSwgaSubmission) => {
      const submissionId = payload.submissionId;

      setRankedSubmissionAttempt(beginRankedSubmission(payload));
      void submitRankedSwgaRun(payload).then((result) => {
        setRankedSubmissionAttempt((currentAttempt) =>
          settleRankedSubmission(currentAttempt, submissionId, result),
        );
      });
    },
    [],
  );

  const expireTimedSessionIfNeeded = useCallback(
    (currentTimeMs: number = Date.now()): boolean => {
      const deadlineMs = timerDeadlineRef.current;

      if (
        gameMode !== "timed" ||
        deadlineMs === null ||
        !hasTimerExpired(deadlineMs, currentTimeMs)
      ) {
        return false;
      }

      setRemainingTimeMs(0);
      setTimedOut(true);
      return true;
    },
    [gameMode],
  );

  useEffect(() => {
    if (
      gameMode !== "timed" ||
      timerDeadlineMs === null ||
      timedOut ||
      runState.status !== "playing"
    ) {
      return undefined;
    }

    const updateRemainingTime = () => {
      const remainingMs = getRemainingTimeMs(timerDeadlineMs, Date.now());
      setRemainingTimeMs(remainingMs);

      if (remainingMs === 0) {
        setTimedOut(true);
      }
    };

    updateRemainingTime();
    const intervalId = window.setInterval(
      updateRemainingTime,
      timerUpdateIntervalMs,
    );

    return () => window.clearInterval(intervalId);
  }, [gameMode, runState.status, timedOut, timerDeadlineMs]);

  useEffect(() => {
    if (
      terminalRankedSubmission === null ||
      automaticallySubmittedIds.current.has(
        terminalRankedSubmission.submissionId,
      )
    ) {
      return;
    }

    automaticallySubmittedIds.current.add(
      terminalRankedSubmission.submissionId,
    );
    sendRankedSubmission(terminalRankedSubmission);
  }, [sendRankedSubmission, terminalRankedSubmission]);

  const submitCurrentGuess = useCallback(() => {
    if (expireTimedSessionIfNeeded()) {
      return;
    }

    if (!canSubmit) {
      setStatusMessage("The run is already over.");
      setStatusTone("warning");
      return;
    }

    const normalizedGuess = guessInput.toLowerCase();

    if (!normalizedGuess) {
      setStatusMessage("Please enter a guess before submitting.");
      setStatusTone("warning");
      return;
    }

    if (!isValidGuessFormat(normalizedGuess, runState.currentWordLength)) {
      setStatusMessage(
        `Use exactly ${runState.currentWordLength} ${letterLabel} for this round.`,
      );
      setStatusTone("warning");
      return;
    }

    if (!isValidAcceptedGuess(normalizedGuess, currentAcceptedGuesses)) {
      setStatusMessage(
        "That word is not in the accepted word bank for this round.",
      );
      setStatusTone("warning");
      return;
    }

    if (isRepeatedGuess(runState, normalizedGuess)) {
      setStatusMessage("You already guessed that word.");
      setStatusTone("warning");
      return;
    }

    const wasCorrect = isCorrectGuess(
      normalizedGuess,
      runState.currentAnswer,
    );
    const nextAnswer = wasCorrect
      ? getAnswerForRound(runState.currentRound + 1)
      : undefined;
    const nextState = submitGuess(
      runState,
      normalizedGuess,
      currentAcceptedGuesses,
      nextAnswer,
    );

    setRunState(nextState);
    setGuessInput("");

    if (nextState.status === "completed") {
      setStatusMessage("You completed the full run!");
      setStatusTone("success");
    } else if (nextState.status === "lost") {
      setStatusMessage(
        `No more guesses remain. The word was "${runState.currentAnswer.toUpperCase()}".`,
      );
      setStatusTone("warning");
    } else if (wasCorrect) {
      setStatusMessage(
        `Correct! Round ${nextState.currentRound} is a ${nextState.currentWordLength}-letter word.`,
      );
      setStatusTone("success");
    } else {
      const nextGuessesRemaining = guessesRemaining - 1;
      const guessLabel = nextGuessesRemaining === 1 ? "guess" : "guesses";
      setStatusMessage(
        `Not quite. ${nextGuessesRemaining} ${guessLabel} remaining.`,
      );
      setStatusTone("info");
    }
  }, [
    canSubmit,
    currentAcceptedGuesses,
    expireTimedSessionIfNeeded,
    guessInput,
    guessesRemaining,
    letterLabel,
    runState,
  ]);

  const applyGuessEdit = useCallback(
    (nextGuess: string) => {
      if (!isEditableGuessChange(guessInput, nextGuess, runState.status)) {
        return;
      }

      setGuessInput(nextGuess);
      setStatusMessage(neutralStatusMessage);
      setStatusTone("info");
    },
    [guessInput, runState.status],
  );

  const addLetter = useCallback(
    (letter: string) => {
      if (
        guessInput.length >= runState.currentWordLength ||
        !/^[a-z]$/i.test(letter)
      ) {
        return;
      }

      const currentTimeMs = Date.now();

      if (expireTimedSessionIfNeeded(currentTimeMs)) {
        return;
      }

      if (gameMode === "timed" && timerDeadlineRef.current === null) {
        const deadlineMs = createTimerDeadline(currentTimeMs);
        const submissionId = ensureRankedSubmissionId(
          gameMode,
          rankedSubmissionId,
        );
        timerDeadlineRef.current = deadlineMs;
        setTimerDeadlineMs(deadlineMs);
        setRemainingTimeMs(TIMED_RUN_DURATION_MS);
        setRankedSubmissionId(submissionId);
      }

      setHasGameplayStarted(true);
      applyGuessEdit(`${guessInput}${letter.toLowerCase()}`);
    },
    [
      applyGuessEdit,
      expireTimedSessionIfNeeded,
      gameMode,
      guessInput,
      rankedSubmissionId,
      runState.currentWordLength,
    ],
  );

  const deleteLetter = useCallback(() => {
    if (expireTimedSessionIfNeeded()) {
      return;
    }

    applyGuessEdit(guessInput.slice(0, -1));
  }, [applyGuessEdit, expireTimedSessionIfNeeded, guessInput]);

  useEffect(() => {
    if (!isRunActive) {
      return undefined;
    }

    const handlePhysicalKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (/^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        addLetter(event.key);
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        deleteLetter();
        return;
      }

      if (event.key === "Enter") {
        if (event.repeat) {
          return;
        }

        const target = event.target;
        if (
          target instanceof HTMLElement &&
          target.closest("button, summary")
        ) {
          return;
        }

        event.preventDefault();
        submitCurrentGuess();
      }
    };

    window.addEventListener("keydown", handlePhysicalKey);
    return () => window.removeEventListener("keydown", handlePhysicalKey);
  }, [addLetter, deleteLetter, isRunActive, submitCurrentGuess]);

  const handleModeChange = (nextMode: SwgaGameMode) => {
    if (modeSelectionLocked) {
      return;
    }

    setGameMode(nextMode);
  };

  const handleRestart = () => {
    timerDeadlineRef.current = null;
    setRunState(createInitialRunState(getInitialAnswer()));
    setGuessInput("");
    setStatusMessage("A fresh run begins. Enter your first guess.");
    setStatusTone("info");
    setTimerDeadlineMs(null);
    setRemainingTimeMs(TIMED_RUN_DURATION_MS);
    setTimedOut(false);
    setHasGameplayStarted(false);
    setRankedSubmissionId(null);
    setRankedSubmissionAttempt(null);
  };

  const handleRankedRetry = () => {
    if (rankedSubmissionAttempt?.status !== "retryable-error") {
      return;
    }

    sendRankedSubmission(rankedSubmissionAttempt.payload);
  };

  return (
    <main
      className={classNames(
        styles.appShell,
        isRunActive ? styles.activeGame : styles.resultsGame,
      )}
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.brandLockup}>
            <p className={styles.eyebrow}>v0.1 Public Alpha</p>
            <h1>SWGA</h1>
          </div>
          <div className={styles.headerActions}>
            <a
              className={classNames(
                styles.secondaryButton,
                styles.feedbackLink,
              )}
              href={feedbackFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the SWGA feedback form in a new tab"
            >
              Feedback
            </a>
            {isRunActive && (
              <details className={styles.helpDisclosure}>
                <summary>Help</summary>
                <div className={styles.helpCard}>
                  <h2>How to play</h2>
                  <p>
                    Find the accepted word in six tries. Each win advances to a
                    word that is one letter longer, from 1 through 20 letters.
                  </p>
                  <p>
                    Score 5 points on the first try, then 4, 3, 2, 1, or 0.
                    Invalid and repeated words do not use a try.
                  </p>
                  <ul
                    className={styles.feedbackLegend}
                    aria-label="Letter feedback key"
                  >
                    <li>
                      <span
                        className={classNames(
                          styles.feedbackKey,
                          styles.green,
                        )}
                        aria-hidden="true"
                      >
                        G
                      </span>
                      Right place
                    </li>
                    <li>
                      <span
                        className={classNames(
                          styles.feedbackKey,
                          styles.yellow,
                        )}
                        aria-hidden="true"
                      >
                        Y
                      </span>
                      Wrong place
                    </li>
                    <li>
                      <span
                        className={classNames(
                          styles.feedbackKey,
                          styles.red,
                        )}
                        aria-hidden="true"
                      >
                        X
                      </span>
                      Not in word
                    </li>
                  </ul>
                </div>
              </details>
            )}
            {isRunActive && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleRestart}
              >
                Restart
              </button>
            )}
          </div>
        </div>

        {isRunActive ? (
          <>
            <div className={styles.modeBar}>
              <div
                className={styles.modeSelector}
                role="group"
                aria-label="Game mode"
              >
                <span className={styles.modeLabel}>Mode</span>
                <button
                  type="button"
                  className={classNames(
                    styles.modeButton,
                    gameMode === "untimed" && styles.selectedMode,
                  )}
                  onClick={() => handleModeChange("untimed")}
                  disabled={modeSelectionLocked}
                  aria-pressed={gameMode === "untimed"}
                >
                  Untimed
                </button>
                <button
                  type="button"
                  className={classNames(
                    styles.modeButton,
                    gameMode === "timed" && styles.selectedMode,
                  )}
                  onClick={() => handleModeChange("timed")}
                  disabled={modeSelectionLocked}
                  aria-pressed={gameMode === "timed"}
                >
                  60 Seconds (Ranked)
                </button>
              </div>

              {isTimedMode && (
                <div
                  className={styles.timerDisplay}
                  role="timer"
                  aria-label={`Time remaining: ${formattedRemainingTime}`}
                >
                  <span>Time</span>
                  <strong aria-hidden="true">{formattedRemainingTime}</strong>
                  {timerDeadlineMs === null && (
                    <small>Starts on first letter</small>
                  )}
                </div>
              )}
            </div>

            <div
              className={styles.compactStats}
              role="group"
              aria-label="Current game stats"
            >
              <div
                className={classNames(styles.compactStat, styles.roundStat)}
              >
                <span>Round</span>
                <strong>
                  {runState.currentRound} / {runState.currentWordLength}{" "}
                  {letterLabel}
                </strong>
              </div>
              <div className={styles.compactStat}>
                <span>Score</span>
                <strong>{runState.totalScore}</strong>
              </div>
              <div className={styles.compactStat}>
                <span>Guesses</span>
                <strong>{guessesRemaining} left</strong>
              </div>
            </div>

            <div
              className={classNames(
                styles.gameBoard,
                runState.currentWordLength > 10 && styles.longWord,
              )}
              style={boardStyle}
              role="group"
              aria-label={`Six-row board for a ${runState.currentWordLength}-letter word`}
            >
              {boardRows.map((row) => (
                <div
                  className={classNames(styles.boardRow, styles[row.kind])}
                  key={row.guessNumber}
                  role="group"
                  aria-label={getBoardRowLabel(row)}
                >
                  {row.cells.map((cell, cellIndex) => (
                    <span
                      className={classNames(
                        styles.boardTile,
                        cell.feedback && styles[cell.feedback],
                        Boolean(cell.letter) && styles.filled,
                      )}
                      key={`${row.guessNumber}-${cellIndex}`}
                      aria-hidden="true"
                    >
                      {cell.letter}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            <div
              className={classNames(styles.statusBox, styles[statusTone])}
              role="status"
              aria-live="polite"
            >
              <span className={styles.visuallyHidden}>Status: </span>
              <p>{statusMessage}</p>
            </div>

            <div
              className={styles.gameKeyboard}
              role="group"
              aria-label="On-screen keyboard"
            >
              {keyboardRows.map((row, rowIndex) => (
                <div
                  className={classNames(
                    styles.keyboardRow,
                    rowIndex === 2 && styles.bottomLetterRow,
                  )}
                  key={`keyboard-row-${rowIndex}`}
                >
                  {row.map((letter) => {
                    const state = keyboardState[letter] ?? "unused";
                    return (
                      <button
                        type="button"
                        className={classNames(
                          styles.keyboardKey,
                          state !== "unused" && styles[state],
                        )}
                        key={letter}
                        onClick={() => addLetter(letter)}
                        aria-label={`Letter ${letter.toUpperCase()}, ${keyboardStateLabels[state]}`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                  {rowIndex === 2 && (
                    <button
                      type="button"
                      className={classNames(
                        styles.keyboardKey,
                        styles.deleteKey,
                      )}
                      onClick={deleteLetter}
                      aria-label="Delete last letter"
                    >
                      <span aria-hidden="true">DEL</span>
                    </button>
                  )}
                </div>
              ))}
              <div
                className={classNames(styles.keyboardRow, styles.enterRow)}
              >
                <button
                  type="button"
                  className={classNames(
                    styles.keyboardKey,
                    styles.actionKey,
                    styles.enterKey,
                  )}
                  onClick={submitCurrentGuess}
                  aria-label="Submit guess"
                >
                  ENTER
                </button>
              </div>
            </div>
          </>
        ) : (
          <section
            className={classNames(
              styles.resultsSection,
              timedOut ? styles.timedOut : styles[runState.status],
            )}
            role="status"
            aria-live="polite"
          >
            <p className={styles.resultsEyebrow}>Final result</p>
            <h2>
              {timedOut
                ? "Time's Up"
                : runState.status === "completed"
                  ? "Run Complete"
                  : "Run Over"}
            </h2>
            <p className={styles.resultsMessage}>
              {timedOut
                ? "The 60-second run has ended."
                : runState.status === "completed"
                  ? "You completed all 20 rounds."
                  : "A strong run - take what you learned into the next one."}
            </p>

            <div
              className={classNames(
                styles.resultsStats,
                timedOut && styles.timedResults,
              )}
            >
              <div className={styles.resultStat}>
                <span>Final score</span>
                <strong>{runState.totalScore}</strong>
              </div>
              <div className={styles.resultStat}>
                <span>Highest round reached</span>
                <strong>{runState.highestWordLengthReached}</strong>
              </div>
              {timedOut && (
                <div className={styles.resultStat}>
                  <span>Time remaining</span>
                  <strong aria-label="Time remaining: 00:00">00:00</strong>
                </div>
              )}
            </div>

            {displayedRankedAttempt && (
              <RankedSubmissionStatus
                attempt={displayedRankedAttempt}
                onRetry={handleRankedRetry}
              />
            )}

            {(runState.status === "lost" || timedOut) && (
              <p className={styles.resultsAnswer}>
                The word was{" "}
                <strong>&quot;{runState.currentAnswer.toUpperCase()}&quot;</strong>.
              </p>
            )}

            <button
              type="button"
              className={classNames(
                styles.primaryButton,
                styles.playAgainButton,
              )}
              onClick={handleRestart}
            >
              Play Again
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
