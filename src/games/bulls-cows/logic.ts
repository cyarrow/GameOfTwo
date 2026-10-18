import { GameError, type GameResult } from '../types';
import { nameOf } from '../helpers';
import { shuffle } from '../shuffle';

export const DIGITS = 4;

export interface BullsCowsGuess {
  by: string;
  guess: string;
  a: number;
  b: number;
}

export interface BullsCowsState {
  order: string[];
  turn: number;
  secret: string;
  guesses: BullsCowsGuess[];
  winner: string | null;
}

export interface BullsCowsMove {
  guess: string;
}

export function setup(playerIds: string[], random: () => number): BullsCowsState {
  const secret = shuffle([...'0123456789'], random).slice(0, DIGITS).join('');
  return { order: shuffle(playerIds, random), turn: 0, secret, guesses: [], winner: null };
}

export function isValidGuess(guess: string): boolean {
  return new RegExp(`^\\d{${DIGITS}}$`).test(guess) && new Set(guess).size === DIGITS;
}

/** A：數字和位置都對；B：數字對但位置不對 */
export function score(secret: string, guess: string): { a: number; b: number } {
  let a = 0;
  let b = 0;
  [...guess].forEach((d, i) => {
    if (secret[i] === d) a++;
    else if (secret.includes(d)) b++;
  });
  return { a, b };
}

export function applyMove(state: BullsCowsState, playerId: string, move: BullsCowsMove): BullsCowsState {
  if (state.winner) throw new GameError('這局已經結束了');
  if (state.order[state.turn] !== playerId) throw new GameError('還沒輪到你');
  if (typeof move.guess !== 'string' || !isValidGuess(move.guess)) throw new GameError(`請輸入 ${DIGITS} 個不重複的數字`);
  const { a, b } = score(state.secret, move.guess);
  return {
    ...state,
    guesses: [...state.guesses, { by: playerId, guess: move.guess, a, b }],
    turn: (state.turn + 1) % state.order.length,
    winner: a === DIGITS ? playerId : null,
  };
}

export function getResult(state: BullsCowsState, names: Record<string, string>): GameResult | null {
  if (!state.winner) return null;
  return {
    points: { [state.winner]: 1 },
    message: `🔢 ${nameOf(names, state.winner)} 猜中密碼 ${state.secret}！（全場共猜了 ${state.guesses.length} 次）`,
  };
}
