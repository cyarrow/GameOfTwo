import { GameError, type GameResult } from '../types';
import { joinNames, pointsForTop } from '../helpers';

export const ROUNDS = 5;
/** 變綠後超過這個時間沒按，就以這個時間計算 */
export const TIMEOUT_MS = 3000;
/** 太早按（還沒變綠） */
export const FALSE_START = -1;

export interface ReactionState {
  players: string[];
  round: number;
  /** 每一輪從開始等待到變綠的時間（毫秒） */
  delays: number[];
  /** results[第幾輪][玩家] = 反應時間（毫秒），FALSE_START 代表太早按 */
  results: Record<string, number>[];
  wins: Record<string, number>;
}

export interface ReactionMove {
  round: number;
  ms: number;
}

export function setup(playerIds: string[], random: () => number): ReactionState {
  return {
    players: playerIds,
    round: 0,
    // 第一輪多等一秒，讓大家看清楚畫面
    delays: Array.from({ length: ROUNDS }, (_, i) => Math.round(2000 + random() * 3000 + (i === 0 ? 1000 : 0))),
    results: Array.from({ length: ROUNDS }, () => ({})),
    wins: Object.fromEntries(playerIds.map((id) => [id, 0])),
  };
}

export function isFinished(state: ReactionState): boolean {
  return state.round >= ROUNDS;
}

/** 這一輪最快的人（可能同時多人）；太早按的不算 */
export function roundWinners(results: Record<string, number>): string[] {
  const valid = Object.entries(results).filter(([, ms]) => ms >= 0);
  if (valid.length === 0) return [];
  const best = Math.min(...valid.map(([, ms]) => ms));
  return valid.filter(([, ms]) => ms === best).map(([id]) => id);
}

export function applyMove(state: ReactionState, playerId: string, move: ReactionMove): ReactionState {
  if (isFinished(state)) throw new GameError('這局已經結束了');
  if (move.round !== state.round) throw new GameError('這一輪已經結束了');
  if (playerId in state.results[state.round]) throw new GameError('這一輪你已經按過了');
  const { ms } = move;
  if (!Number.isInteger(ms) || (ms !== FALSE_START && (ms < 0 || ms > TIMEOUT_MS))) throw new GameError('時間不正確');

  const current = { ...state.results[state.round], [playerId]: ms };
  const results = state.results.map((r, i) => (i === state.round ? current : r));
  if (!state.players.every((id) => id in current)) return { ...state, results };

  const wins = { ...state.wins };
  for (const id of roundWinners(current)) wins[id] += 1;
  return { ...state, results, wins, round: state.round + 1 };
}

export function getResult(state: ReactionState, names: Record<string, string>): GameResult | null {
  if (!isFinished(state)) return null;
  const { winners, points } = pointsForTop(state.wins);
  const message =
    winners.length === 0
      ? '⚡ 大家都太早按了…'
      : `⚡ ${joinNames(names, winners)} 贏了 ${state.wins[winners[0]]} 輪，反應最快！`;
  return { points, message };
}
