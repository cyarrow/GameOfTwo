import { GameError, type GameResult } from '../types';
import { joinNames, pointsForTop } from '../helpers';
import { shuffle } from '../shuffle';

const SYMBOLS = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🐯', '🐷', '🐙', '🦄', '🐧', '🐢'];
export const PAIRS = 10;

export interface MemoryState {
  order: string[];
  turn: number;
  cards: string[];
  /** 被誰配對成功；null 表示還沒配對 */
  matchedBy: (string | null)[];
  /** 目前翻開、尚未配對的牌（最多兩張）。沒配對成功時會保留到下一位玩家翻牌為止 */
  flipped: number[];
  pairs: Record<string, number>;
}

export interface MemoryMove {
  card: number;
}

export function setup(playerIds: string[], random: () => number): MemoryState {
  const symbols = shuffle(SYMBOLS, random).slice(0, PAIRS);
  const cards = shuffle([...symbols, ...symbols], random);
  return {
    order: shuffle(playerIds, random),
    turn: 0,
    cards,
    matchedBy: cards.map(() => null),
    flipped: [],
    pairs: Object.fromEntries(playerIds.map((id) => [id, 0])),
  };
}

export function currentPlayer(state: MemoryState): string {
  return state.order[state.turn];
}

export function isFinished(state: MemoryState): boolean {
  return state.matchedBy.every((m) => m !== null);
}

export function applyMove(state: MemoryState, playerId: string, move: MemoryMove): MemoryState {
  if (isFinished(state)) throw new GameError('這局已經結束了');
  if (currentPlayer(state) !== playerId) throw new GameError('還沒輪到你');

  // 上一位沒配對成功的兩張牌，在這次翻牌時蓋回去
  const flipped = state.flipped.length === 2 ? [] : state.flipped;
  const { card } = move;
  if (!Number.isInteger(card) || card < 0 || card >= state.cards.length) throw new GameError('沒有這張牌');
  if (state.matchedBy[card] !== null || flipped.includes(card)) throw new GameError('這張已經翻開了');

  const next = [...flipped, card];
  if (next.length < 2) return { ...state, flipped: next };

  const [a, b] = next;
  if (state.cards[a] === state.cards[b]) {
    // 配對成功：拿走這兩張，同一位玩家繼續
    const matchedBy = state.matchedBy.map((m, i) => (i === a || i === b ? playerId : m));
    return { ...state, matchedBy, flipped: [], pairs: { ...state.pairs, [playerId]: state.pairs[playerId] + 1 } };
  }
  return { ...state, flipped: next, turn: (state.turn + 1) % state.order.length };
}

export function getResult(state: MemoryState, names: Record<string, string>): GameResult | null {
  if (!isFinished(state)) return null;
  const { winners, points } = pointsForTop(state.pairs);
  return { points, message: `🃏 ${joinNames(names, winners)} 以 ${state.pairs[winners[0]]} 對獲勝！` };
}
