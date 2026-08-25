import type { GuessFeedback, RunStatus, SubmittedGuess } from './swga'

export const BOARD_ROW_COUNT = 6

export type KeyboardKeyState = 'unused' | 'absent' | 'yellow' | 'green'

export interface BoardCell {
  letter: string
  feedback: GuessFeedback | null
}

export interface BoardRow {
  kind: 'submitted' | 'current' | 'empty'
  cells: BoardCell[]
  guessNumber: number
}

const keyboardStatePriority: Record<KeyboardKeyState, number> = {
  unused: 0,
  absent: 1,
  yellow: 2,
  green: 3,
}

export function isEditableGuessChange(
  currentGuess: string,
  nextGuess: string,
  runStatus: RunStatus,
): boolean {
  return runStatus === 'playing' && currentGuess !== nextGuess
}

function toKeyboardKeyState(feedback: GuessFeedback): KeyboardKeyState {
  return feedback === 'red' ? 'absent' : feedback
}

export function buildKeyboardState(
  submittedGuesses: readonly SubmittedGuess[],
): Record<string, KeyboardKeyState> {
  const keyboardState: Record<string, KeyboardKeyState> = {}

  for (const submittedGuess of submittedGuesses) {
    submittedGuess.guess.split('').forEach((letter, index) => {
      const normalizedLetter = letter.toLowerCase()
      const nextState = toKeyboardKeyState(submittedGuess.feedback[index] ?? 'red')
      const currentState = keyboardState[normalizedLetter] ?? 'unused'

      if (keyboardStatePriority[nextState] > keyboardStatePriority[currentState]) {
        keyboardState[normalizedLetter] = nextState
      }
    })
  }

  return keyboardState
}

export function buildBoardRows(
  submittedGuesses: readonly SubmittedGuess[],
  currentGuess: string,
  wordLength: number,
): BoardRow[] {
  return Array.from({ length: BOARD_ROW_COUNT }, (_, rowIndex) => {
    const submittedGuess = submittedGuesses[rowIndex]

    if (submittedGuess) {
      return {
        kind: 'submitted',
        guessNumber: rowIndex + 1,
        cells: Array.from({ length: wordLength }, (_, cellIndex) => ({
          letter: submittedGuess.guess[cellIndex] ?? '',
          feedback: submittedGuess.feedback[cellIndex] ?? null,
        })),
      }
    }

    if (rowIndex === submittedGuesses.length) {
      return {
        kind: 'current',
        guessNumber: rowIndex + 1,
        cells: Array.from({ length: wordLength }, (_, cellIndex) => ({
          letter: currentGuess[cellIndex] ?? '',
          feedback: null,
        })),
      }
    }

    return {
      kind: 'empty',
      guessNumber: rowIndex + 1,
      cells: Array.from({ length: wordLength }, () => ({
        letter: '',
        feedback: null,
      })),
    }
  })
}
