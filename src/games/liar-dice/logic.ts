import { GameError, type GameResult } from '../types';
import { nameOf } from '../helpers';
import { shuffle } from '../shuffle';

export const DICE_PER_PLAYER = 5;

export interface Bid {
  by: string;
  quantity: number;
  face: number;
}

export interface LiarDiceState {
  order: string[];
  dice: Record<string, number[]>;
  turn: number;
  bids: Bid[];
  /** 有人喊「開」之後才會有值 */
  reveal: { by: string; count: number; loser: string } | null;
}

export type LiarDiceMove = { type: 'bid'; quantity: number; face: number } | { type: 'challenge' };

export function setup(playerIds: string[], random: () => number): LiarDiceState {
  const roll = () => Array.from({ length: DICE_PER_PLAYER }, () => 1 + Math.floor(random() * 6)).sort();
  return {
    order: shuffle(playerIds, random),
    dice: Object.fromEntries(playerIds.map((id) => [id, roll()])),
    turn: 0,
    bids: [],
    reveal: null,
  };
}

export function currentPlayer(state: LiarDiceState): string {
  return state.order[state.turn];
}

export function totalDice(state: LiarDiceState): number {
  return state.order.length * DICE_PER_PLAYER;
}

/** 第一口至少要喊「玩家人數」個 */
export function minQuantity(state: LiarDiceState): number {
  return state.order.length;
}

export function isValidBid(state: LiarDiceState, quantity: number, face: number): boolean {
  if (!Number.isInteger(quantity) || !Number.isInteger(face)) return false;
  if (face < 2 || face > 6 || quantity > totalDice(state)) return false;
  const last = state.bids[state.bids.length - 1];
  if (!last) return quantity >= minQuantity(state);
  return quantity > last.quantity || (quantity === last.quantity && face > last.face);
}

/** 比上一口大的最小喊法，給畫面當預設值 */
export function nextMinBid(state: LiarDiceState): { quantity: number; face: number } {
  const last = state.bids[state.bids.length - 1];
  if (!last) return { quantity: minQuantity(state), face: 2 };
  return last.face < 6 ? { quantity: last.quantity, face: last.face + 1 } : { quantity: last.quantity + 1, face: 2 };
}

/** 1 是萬用骰，算任何點數 */
export function countFace(state: LiarDiceState, face: number): number {
  return Object.values(state.dice)
    .flat()
    .filter((d) => d === face || d === 1).length;
}

export function applyMove(state: LiarDiceState, playerId: string, move: LiarDiceMove): LiarDiceState {
  if (state.reveal) throw new GameError('這局已經結束了');
  if (currentPlayer(state) !== playerId) throw new GameError('還沒輪到你');

  if (move.type === 'challenge') {
    const last = state.bids[state.bids.length - 1];
    if (!last) throw new GameError('還沒有人喊，不能開');
    const count = countFace(state, last.face);
    const loser = count >= last.quantity ? playerId : last.by;
    return { ...state, reveal: { by: playerId, count, loser } };
  }

  if (!isValidBid(state, move.quantity, move.face)) {
    const min = nextMinBid(state);
    throw new GameError(`要喊得比上一口大，例如 ${min.quantity} 個 ${min.face}`);
  }
  return {
    ...state,
    bids: [...state.bids, { by: playerId, quantity: move.quantity, face: move.face }],
    turn: (state.turn + 1) % state.order.length,
  };
}

export function getResult(state: LiarDiceState, names: Record<string, string>): GameResult | null {
  if (!state.reveal) return null;
  const last = state.bids[state.bids.length - 1];
  const { count, loser } = state.reveal;
  return {
    points: Object.fromEntries(state.order.map((id) => [id, id === loser ? 0 : 1])),
    message: `🎲 喊 ${last.quantity} 個 ${last.face}，實際有 ${count} 個，${nameOf(names, loser)} 輸了！`,
  };
}
