import { GameError, type GameResult } from '../types';
import { shuffle } from '../shuffle';

export const MIN = 1;
export const MAX = 100;

export interface GuessBombState {
  /** 目前可猜範圍是 low+1 ~ high-1（不含 low、high 本身） */
  low: number;
  high: number;
  bomb: number;
  order: string[];
  turn: number;
  guesses: { by: string; value: number }[];
  loser: string | null;
}

export interface GuessBombMove {
  value: number;
}

export function setup(playerIds: string[], random: () => number): GuessBombState {
  return {
    low: MIN - 1,
    high: MAX + 1,
    bomb: MIN + Math.floor(random() * (MAX - MIN + 1)),
    order: shuffle(playerIds, random),
    turn: 0,
    guesses: [],
    loser: null,
  };
}

export function currentPlayer(state: GuessBombState): string {
  return state.order[state.turn];
}

export function applyMove(state: GuessBombState, playerId: string, move: GuessBombMove): GuessBombState {
  if (state.loser) throw new GameError('這局已經結束了');
  if (currentPlayer(state) !== playerId) throw new GameError('還沒輪到你');
  const { value } = move;
  if (!Number.isInteger(value) || value <= state.low || value >= state.high) {
    throw new GameError(`請輸入 ${state.low + 1} ~ ${state.high - 1} 之間的整數`);
  }

  const next: GuessBombState = {
    ...state,
    guesses: [...state.guesses, { by: playerId, value }],
    turn: (state.turn + 1) % state.order.length,
  };
  if (value === state.bomb) next.loser = playerId;
  else if (value < state.bomb) next.low = value;
  else next.high = value;
  return next;
}

export function getResult(state: GuessBombState, names: Record<string, string>): GameResult | null {
  if (!state.loser) return null;
  const points = Object.fromEntries(state.order.map((id) => [id, id === state.loser ? 0 : 1]));
  return {
    points,
    message: `💣 ${names[state.loser] ?? '某位玩家'} 踩到炸彈 ${state.bomb}！其他人各得 1 分`,
  };
}
