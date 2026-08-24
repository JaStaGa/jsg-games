export type GuessFeedback = "green" | "yellow" | "red";
export type RunStatus = "playing" | "lost" | "completed";

export interface SubmittedGuess {
  guess: string;
  feedback: GuessFeedback[];
  guessNumber: number;
  score: number;
}

export interface RunState {
  currentRound: number;
  currentWordLength: number;
  currentAnswer: string;
  guesses: SubmittedGuess[];
  totalScore: number;
  highestWordLengthReached: number;
  status: RunStatus;
}

function normalizeGuess(guess: string): string {
  return guess.toLowerCase();
}

export function evaluateGuess(
  guess: string,
  answer: string,
): GuessFeedback[] {
  const normalizedGuess = normalizeGuess(guess);
  const normalizedAnswer = normalizeGuess(answer);

  if (normalizedGuess.length !== normalizedAnswer.length) {
    throw new Error("Guess and answer must have the same length.");
  }

  const feedback: GuessFeedback[] = Array(normalizedGuess.length).fill("red");
  const remainingLetters = new Map<string, number>();

  for (const letter of normalizedAnswer) {
    remainingLetters.set(letter, (remainingLetters.get(letter) ?? 0) + 1);
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (normalizedGuess[index] === normalizedAnswer[index]) {
      feedback[index] = "green";
      remainingLetters.set(
        normalizedGuess[index],
        (remainingLetters.get(normalizedGuess[index]) ?? 0) - 1,
      );
    }
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (feedback[index] === "green") {
      continue;
    }

    const letter = normalizedGuess[index];
    const remainingCount = remainingLetters.get(letter) ?? 0;

    if (remainingCount > 0) {
      feedback[index] = "yellow";
      remainingLetters.set(letter, remainingCount - 1);
    }
  }

  return feedback;
}

export function calculateRoundScore(guessNumber: number): number | null {
  if (!Number.isInteger(guessNumber) || guessNumber < 1 || guessNumber > 6) {
    return null;
  }

  return Math.max(0, 6 - guessNumber);
}

export function isCorrectGuess(guess: string, answer: string): boolean {
  return normalizeGuess(guess) === normalizeGuess(answer);
}

export function isValidGuessFormat(guess: string, wordLength: number): boolean {
  if (!Number.isInteger(wordLength) || wordLength < 1) {
    return false;
  }

  const normalizedGuess = normalizeGuess(guess);

  return /^[a-z]+$/.test(normalizedGuess) && normalizedGuess.length === wordLength;
}

export function isValidAcceptedGuess(
  guess: string,
  acceptedGuesses: readonly string[],
): boolean {
  return acceptedGuesses.some(
    (acceptedGuess) => normalizeGuess(acceptedGuess) === normalizeGuess(guess),
  );
}

export function isRepeatedGuess(state: RunState, guess: string): boolean {
  const normalizedGuess = normalizeGuess(guess);

  return state.guesses.some(
    (submittedGuess) => normalizeGuess(submittedGuess.guess) === normalizedGuess,
  );
}

export function createInitialRunState(answer: string): RunState {
  const normalizedAnswer = normalizeGuess(answer);

  if (normalizedAnswer.length !== 1) {
    throw new Error("Initial run answer must be exactly 1 letter long.");
  }

  return {
    currentRound: 1,
    currentWordLength: normalizedAnswer.length,
    currentAnswer: normalizedAnswer,
    guesses: [],
    totalScore: 0,
    highestWordLengthReached: normalizedAnswer.length,
    status: "playing",
  };
}

export function canSubmitGuess(state: RunState): boolean {
  return state.status === "playing" && state.guesses.length < 6;
}

export function hasRoundEnded(state: RunState): boolean {
  return state.status !== "playing" || state.guesses.length >= 6;
}

export function submitGuess(
  state: RunState,
  guess: string,
  acceptedGuesses: readonly string[],
  nextAnswer?: string,
): RunState {
  if (!canSubmitGuess(state)) {
    return state;
  }

  if (isRepeatedGuess(state, guess)) {
    return state;
  }

  const isValidGuess =
    isValidGuessFormat(guess, state.currentWordLength) &&
    isValidAcceptedGuess(guess, acceptedGuesses);

  if (!isValidGuess) {
    return state;
  }

  const guessNumber = state.guesses.length + 1;
  const normalizedGuess = normalizeGuess(guess);
  const feedback = evaluateGuess(normalizedGuess, state.currentAnswer);
  const isCorrect = isCorrectGuess(normalizedGuess, state.currentAnswer);
  const roundScore = calculateRoundScore(guessNumber) ?? 0;

  let normalizedNextAnswer = "";
  let nextAnswerLength = state.currentWordLength;

  if (isCorrect && state.currentRound < 20) {
    if (nextAnswer === undefined) {
      throw new Error("nextAnswer is required to advance to the next round");
    }

    const expectedLength = state.currentRound + 1;
    normalizedNextAnswer = normalizeGuess(nextAnswer);

    if (normalizedNextAnswer.length !== expectedLength) {
      throw new Error(
        `nextAnswer must have length ${expectedLength} for round ${state.currentRound + 1}`,
      );
    }

    nextAnswerLength = normalizedNextAnswer.length;
  }

  const score = isCorrect ? roundScore : 0;
  const submittedGuess: SubmittedGuess = {
    guess: normalizedGuess,
    feedback,
    guessNumber,
    score,
  };

  const updatedGuesses = [...state.guesses, submittedGuess];
  const updatedScore = state.totalScore + score;

  if (isCorrect) {
    if (state.currentRound >= 20) {
      return {
        ...state,
        guesses: updatedGuesses,
        totalScore: updatedScore,
        highestWordLengthReached: state.currentWordLength,
        status: "completed",
      };
    }

    return {
      currentRound: state.currentRound + 1,
      currentWordLength: nextAnswerLength,
      currentAnswer: normalizedNextAnswer,
      guesses: [],
      totalScore: updatedScore,
      highestWordLengthReached: Math.max(state.highestWordLengthReached, nextAnswerLength),
      status: "playing",
    };
  }

  if (updatedGuesses.length >= 6) {
    return {
      ...state,
      guesses: updatedGuesses,
      totalScore: updatedScore,
      status: "lost",
    };
  }

  return {
    ...state,
    guesses: updatedGuesses,
    totalScore: updatedScore,
  };
}
