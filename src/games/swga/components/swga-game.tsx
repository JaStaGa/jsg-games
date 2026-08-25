"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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

export function SwgaGame() {
  const [runState, setRunState] = useState<RunState>(() =>
    createInitialRunState(getInitialAnswer()),
  );
  const [guessInput, setGuessInput] = useState("");
  const [statusMessage, setStatusMessage] = useState(neutralStatusMessage);
  const [statusTone, setStatusTone] = useState<
    "info" | "success" | "warning"
  >("info");

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
  const boardStyle = {
    "--board-max-width": `${runState.currentWordLength * 48 + Math.max(0, runState.currentWordLength - 1) * 5}px`,
    "--word-length": runState.currentWordLength,
    "--tile-font-size": `${Math.max(0.55, Math.min(1.2, 11 / runState.currentWordLength))}rem`,
  } as CSSProperties;

  const submitCurrentGuess = useCallback(() => {
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

      applyGuessEdit(`${guessInput}${letter.toLowerCase()}`);
    },
    [applyGuessEdit, guessInput, runState.currentWordLength],
  );

  const deleteLetter = useCallback(() => {
    applyGuessEdit(guessInput.slice(0, -1));
  }, [applyGuessEdit, guessInput]);

  useEffect(() => {
    if (runState.status !== "playing") {
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
  }, [addLetter, deleteLetter, runState.status, submitCurrentGuess]);

  const handleRestart = () => {
    setRunState(createInitialRunState(getInitialAnswer()));
    setGuessInput("");
    setStatusMessage("A fresh run begins. Enter your first guess.");
    setStatusTone("info");
  };

  return (
    <main
      className={classNames(
        styles.appShell,
        runState.status === "playing"
          ? styles.activeGame
          : styles.resultsGame,
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
            {runState.status === "playing" && (
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
            {runState.status === "playing" && (
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

        {runState.status === "playing" ? (
          <>
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
              styles[runState.status],
            )}
            role="status"
            aria-live="polite"
          >
            <p className={styles.resultsEyebrow}>Final result</p>
            <h2>
              {runState.status === "completed" ? "Run Complete" : "Run Over"}
            </h2>
            <p className={styles.resultsMessage}>
              {runState.status === "completed"
                ? "You completed all 20 rounds."
                : "A strong run - take what you learned into the next one."}
            </p>

            <div className={styles.resultsStats}>
              <div className={styles.resultStat}>
                <span>Final score</span>
                <strong>{runState.totalScore}</strong>
              </div>
              <div className={styles.resultStat}>
                <span>Highest round reached</span>
                <strong>{runState.highestWordLengthReached}</strong>
              </div>
            </div>

            {runState.status === "lost" && (
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
