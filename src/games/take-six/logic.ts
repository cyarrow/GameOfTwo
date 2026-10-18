import { GameError, type GameResult } from '../types';
import { joinNames } from '../helpers';
import { shuffle } from '../shuffle';

export const DECK_SIZE = 104;
export const HAND_SIZE = 10;
export const ROW_COUNT = 4;
/** 一排最多 5 張，放第 6 張的人要把前 5 張收走 */
export const ROW_LIMIT = 5;

export function bullheads(card: number): number {
  if (card === 55) return 7;
  if (card % 11 === 0) return 5;
  if (card % 10 === 0) return 3;
  if (card % 5 === 0) return 2;
  return 1;
}

export function sumBullheads(cards: number[]): number {
  return cards.reduce((sum, c) => sum + bullheads(c), 0);
}

export interface Placement {
  by: string;
  card: number;
  row: number;
  /** 收走的牌；沒收牌時是空陣列 */
  took: number[];
}

export interface TakeSixState {
  players: string[];
  hands: Record<string, number[]>;
  rows: number[][];
  /** 這一輪每個人選好的牌（全員選好後才結算） */
  chosen: Record<string, number>;
  penalties: Record<string, number>;
  turn: number;
  lastPlacements: Placement[];
}

export interface TakeSixMove {
  turn: number;
  card: number;
}

export function setup(playerIds: string[], random: () => number): TakeSixState {
  const deck = shuffle(
    Array.from({ length: DECK_SIZE }, (_, i) => i + 1),
    random,
  );
  const hands: Record<string, number[]> = {};
  playerIds.forEach((id, i) => {
    hands[id] = deck.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE).sort((a, b) => a - b);
  });
  const rest = deck.slice(playerIds.length * HAND_SIZE);
  return {
    players: playerIds,
    hands,
    rows: rest.slice(0, ROW_COUNT).map((c) => [c]),
    chosen: {},
    penalties: Object.fromEntries(playerIds.map((id) => [id, 0])),
    turn: 1,
    lastPlacements: [],
  };
}

export function isFinished(state: TakeSixState): boolean {
  return state.turn > HAND_SIZE;
}

/** 牌要放在「結尾比它小、而且最接近」的那一排；比每排結尾都小時回傳 -1 */
export function targetRow(rows: number[][], card: number): number {
  let best = -1;
  rows.forEach((row, i) => {
    const last = row[row.length - 1];
    if (last < card && (best === -1 || last > rows[best][rows[best].length - 1])) best = i;
  });
  return best;
}

/** 牌太小放不進任何一排時，自動收走牛頭最少的那排（同分取前面的） */
export function cheapestRow(rows: number[][]): number {
  let best = 0;
  rows.forEach((row, i) => {
    if (sumBullheads(row) < sumBullheads(rows[best])) best = i;
  });
  return best;
}

function resolve(state: TakeSixState, chosen: Record<string, number>): TakeSixState {
  const rows = state.rows.map((r) => [...r]);
  const penalties = { ...state.penalties };
  const hands = { ...state.hands };
  const placements: Placement[] = [];

  const plays = Object.entries(chosen).sort((a, b) => a[1] - b[1]);
  for (const [by, card] of plays) {
    hands[by] = hands[by].filter((c) => c !== card);
    let row = targetRow(rows, card);
    let took: number[] = [];
    if (row === -1) {
      row = cheapestRow(rows);
      took = rows[row];
      rows[row] = [card];
    } else if (rows[row].length >= ROW_LIMIT) {
      took = rows[row];
      rows[row] = [card];
    } else {
      rows[row].push(card);
    }
    penalties[by] += sumBullheads(took);
    placements.push({ by, card, row, took });
  }
  return { ...state, rows, hands, penalties, chosen: {}, turn: state.turn + 1, lastPlacements: placements };
}

export function applyMove(state: TakeSixState, playerId: string, move: TakeSixMove): TakeSixState {
  if (isFinished(state)) throw new GameError('這局已經結束了');
  if (move.turn !== state.turn) throw new GameError('這一輪已經結束了');
  if (playerId in state.chosen) throw new GameError('這一輪你已經出過牌了');
  if (!state.hands[playerId]?.includes(move.card)) throw new GameError('你手上沒有這張牌');

  const chosen = { ...state.chosen, [playerId]: move.card };
  if (!state.players.every((id) => id in chosen)) return { ...state, chosen };
  return resolve(state, chosen);
}

export function getResult(state: TakeSixState, names: Record<string, string>): GameResult | null {
  if (!isFinished(state)) return null;
  const least = Math.min(...state.players.map((id) => state.penalties[id]));
  const winners = state.players.filter((id) => state.penalties[id] === least);
  return {
    points: Object.fromEntries(winners.map((id) => [id, 1])),
    message: `🐮 ${joinNames(names, winners)} 只收到 ${least} 個牛頭，獲勝！`,
  };
}
