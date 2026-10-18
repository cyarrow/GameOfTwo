import { GameError, type GameResult } from '../types';
import { joinNames, pointsForTop } from '../helpers';

export const DURATION_SECONDS = 10;
export const COUNTDOWN_SECONDS = 3;
/** 每秒 30 下已經是人類極限，超過就當作作弊 */
export const MAX_TAPS = DURATION_SECONDS * 30;

export interface TapRaceState {
  players: string[];
  ready: Record<string, boolean>;
  started: boolean;
  counts: Record<string, number>;
  done: Record<string, boolean>;
}

export type TapRaceMove = { type: 'ready' } | { type: 'progress'; count: number } | { type: 'final'; count: number };

export function setup(playerIds: string[]): TapRaceState {
  return {
    players: playerIds,
    ready: {},
    started: false,
    counts: Object.fromEntries(playerIds.map((id) => [id, 0])),
    done: {},
  };
}

export function isFinished(state: TapRaceState): boolean {
  return state.players.every((id) => state.done[id]);
}

export function applyMove(state: TapRaceState, playerId: string, move: TapRaceMove): TapRaceState {
  if (move.type === 'ready') {
    if (state.started) return state;
    const ready = { ...state.ready, [playerId]: true };
    return { ...state, ready, started: state.players.every((id) => ready[id]) };
  }

  if (!state.started) throw new GameError('還沒開始');
  if (state.done[playerId]) return state;
  if (!Number.isInteger(move.count) || move.count < 0 || move.count > MAX_TAPS) throw new GameError('次數不正確');
  // 進度可能晚到，所以只取最大值
  const counts = { ...state.counts, [playerId]: Math.max(state.counts[playerId] ?? 0, move.count) };
  const done = move.type === 'final' ? { ...state.done, [playerId]: true } : state.done;
  return { ...state, counts, done };
}

export function getResult(state: TapRaceState, names: Record<string, string>): GameResult | null {
  if (!isFinished(state)) return null;
  const { winners, points } = pointsForTop(state.counts);
  const message =
    winners.length === 0
      ? '👆 大家都沒點…'
      : `👆 ${joinNames(names, winners)} 以 ${state.counts[winners[0]]} 下獲勝！`;
  return { points, message };
}
