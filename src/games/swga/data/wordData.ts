import answers01 from './answers/01.json';
import answers02 from './answers/02.json';
import answers03 from './answers/03.json';
import answers04 from './answers/04.json';
import answers05 from './answers/05.json';
import answers06 from './answers/06.json';
import answers07 from './answers/07.json';
import answers08 from './answers/08.json';
import answers09 from './answers/09.json';
import answers10 from './answers/10.json';
import answers11 from './answers/11.json';
import answers12 from './answers/12.json';
import answers13 from './answers/13.json';
import answers14 from './answers/14.json';
import answers15 from './answers/15.json';
import answers16 from './answers/16.json';
import answers17 from './answers/17.json';
import answers18 from './answers/18.json';
import answers19 from './answers/19.json';
import answers20 from './answers/20.json';
import acceptedGuesses01 from './accepted-guesses/01.json';
import acceptedGuesses02 from './accepted-guesses/02.json';
import acceptedGuesses03 from './accepted-guesses/03.json';
import acceptedGuesses04 from './accepted-guesses/04.json';
import acceptedGuesses05 from './accepted-guesses/05.json';
import acceptedGuesses06 from './accepted-guesses/06.json';
import acceptedGuesses07 from './accepted-guesses/07.json';
import acceptedGuesses08 from './accepted-guesses/08.json';
import acceptedGuesses09 from './accepted-guesses/09.json';
import acceptedGuesses10 from './accepted-guesses/10.json';
import acceptedGuesses11 from './accepted-guesses/11.json';
import acceptedGuesses12 from './accepted-guesses/12.json';
import acceptedGuesses13 from './accepted-guesses/13.json';
import acceptedGuesses14 from './accepted-guesses/14.json';
import acceptedGuesses15 from './accepted-guesses/15.json';
import acceptedGuesses16 from './accepted-guesses/16.json';
import acceptedGuesses17 from './accepted-guesses/17.json';
import acceptedGuesses18 from './accepted-guesses/18.json';
import acceptedGuesses19 from './accepted-guesses/19.json';
import acceptedGuesses20 from './accepted-guesses/20.json';

export const MIN_WORD_LENGTH = 1;
export const MAX_WORD_LENGTH = 20;

const answerPools: readonly string[][] = [
  answers01,
  answers02,
  answers03,
  answers04,
  answers05,
  answers06,
  answers07,
  answers08,
  answers09,
  answers10,
  answers11,
  answers12,
  answers13,
  answers14,
  answers15,
  answers16,
  answers17,
  answers18,
  answers19,
  answers20,
];

const acceptedGuessPools: readonly string[][] = [
  acceptedGuesses01,
  acceptedGuesses02,
  acceptedGuesses03,
  acceptedGuesses04,
  acceptedGuesses05,
  acceptedGuesses06,
  acceptedGuesses07,
  acceptedGuesses08,
  acceptedGuesses09,
  acceptedGuesses10,
  acceptedGuesses11,
  acceptedGuesses12,
  acceptedGuesses13,
  acceptedGuesses14,
  acceptedGuesses15,
  acceptedGuesses16,
  acceptedGuesses17,
  acceptedGuesses18,
  acceptedGuesses19,
  acceptedGuesses20,
];

export function getInitialAnswer(random: () => number = Math.random): string {
  return getAnswerForRound(1, random) ?? 'a';
}

export function getAnswerForRound(
  roundNumber: number,
  random: () => number = Math.random,
): string | undefined {
  if (roundNumber < MIN_WORD_LENGTH || roundNumber > MAX_WORD_LENGTH) {
    return undefined;
  }

  const answerPool = answerPools[roundNumber - 1];

  if (!answerPool?.length) {
    return undefined;
  }

  const answerIndex = Math.min(
    Math.floor(random() * answerPool.length),
    answerPool.length - 1,
  );

  return answerPool[answerIndex];
}

export function getAcceptedGuessesForWordLength(wordLength: number): string[] {
  if (wordLength < MIN_WORD_LENGTH || wordLength > MAX_WORD_LENGTH) {
    return [];
  }

  return [...(acceptedGuessPools[wordLength - 1] ?? [])];
}
