import { describe, expect, it } from 'vitest'

import {
  buildBoardRows,
  buildKeyboardState,
  isEditableGuessChange,
} from '../logic/game-ui'
import type { RunStatus, SubmittedGuess } from '../logic/swga'

function submittedGuess(
  guess: string,
  feedback: SubmittedGuess['feedback'],
  guessNumber = 1,
): SubmittedGuess {
  return { guess, feedback, guessNumber, score: 0 }
}

describe('game UI helpers', () => {
  it.each([
    { scenario: 'a letter is appended', currentGuess: 'ca', nextGuess: 'cat', runStatus: 'playing', expected: true },
    { scenario: 'a letter is deleted', currentGuess: 'cat', nextGuess: 'ca', runStatus: 'playing', expected: true },
    { scenario: 'the input is already full', currentGuess: 'cat', nextGuess: 'cat', runStatus: 'playing', expected: false },
    { scenario: 'the input is already empty', currentGuess: '', nextGuess: '', runStatus: 'playing', expected: false },
    { scenario: 'the run is lost', currentGuess: 'ca', nextGuess: 'cat', runStatus: 'lost', expected: false },
    { scenario: 'the run is completed', currentGuess: 'ca', nextGuess: 'cat', runStatus: 'completed', expected: false },
  ] satisfies Array<{
    scenario: string
    currentGuess: string
    nextGuess: string
    runStatus: RunStatus
    expected: boolean
  }>)(
    'returns $expected when $scenario',
    ({ currentGuess, nextGuess, runStatus, expected }) => {
      expect(isEditableGuessChange(currentGuess, nextGuess, runStatus)).toBe(expected)
    },
  )

  it('builds six rows with submitted, current, and empty guesses in order', () => {
    const rows = buildBoardRows(
      [submittedGuess('crane', ['red', 'yellow', 'green', 'red', 'red'])],
      'sp',
      5,
    )

    expect(rows).toHaveLength(6)
    expect(rows.map((row) => row.kind)).toEqual([
      'submitted',
      'current',
      'empty',
      'empty',
      'empty',
      'empty',
    ])
    expect(rows[0]?.cells.map((cell) => cell.letter).join('')).toBe('crane')
    expect(rows[1]?.cells.map((cell) => cell.letter).join('')).toBe('sp')
    expect(rows[2]?.cells.every((cell) => cell.letter === '')).toBe(true)
  })

  it('builds a fresh empty board when a new round has no guesses or input', () => {
    const rows = buildBoardRows([], '', 3)

    expect(rows).toHaveLength(6)
    expect(rows[0]?.kind).toBe('current')
    expect(rows.slice(1).every((row) => row.kind === 'empty')).toBe(true)
    expect(rows.every((row) => row.cells.length === 3)).toBe(true)
  })

  it('maps red feedback to the absent keyboard state', () => {
    const state = buildKeyboardState([
      submittedGuess('abc', ['red', 'yellow', 'green']),
    ])

    expect(state).toEqual({ a: 'absent', b: 'yellow', c: 'green' })
  })

  it('never downgrades green feedback after later yellow or absent feedback', () => {
    const state = buildKeyboardState([
      submittedGuess('aaa', ['green', 'yellow', 'red'], 1),
      submittedGuess('aaa', ['red', 'yellow', 'red'], 2),
    ])

    expect(state.a).toBe('green')
  })

  it('never downgrades yellow feedback after later absent feedback', () => {
    const state = buildKeyboardState([
      submittedGuess('a', ['yellow'], 1),
      submittedGuess('a', ['red'], 2),
    ])

    expect(state.a).toBe('yellow')
  })
})
