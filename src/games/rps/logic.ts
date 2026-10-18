import { GameError, type GameResult } from '../types';
import { joinNames } from '../helpers';

export const TARGET_WINS = 3;

export type Choice = 'rock' | 'paper' | 'scissors';
export const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];
const BEATS: Record<Choice, Choice> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

export interface RpsState {
  players: string[];
  round: number;
  picks: Record<string, Choice>;
  wins: Record<string, number>;
  /** 上一輪的結果，給畫面顯示用 */
  last: { round: number; picks: Record<string, Choice>; winners: string[] } | null;
}

export interface RpsMove {
  round: number;
  choice: Choice;
}

export function setup(playerIds: string[]): RpsState {
  return {
    players: playerIds,
    round: 1,
    picks: {},
    wins: Object.fromEntries(playerIds.map((id) => [id, 0])),
    last: null,
  };
}

/** 多人猜拳：剛好出現兩種手勢時才分勝負，否則平手 */
export function roundWinners(picks: Record<string, Choice>): string[] {
  const kinds = new Set(Object.values(picks));
  if (kinds.size !== 2) return [];
  const [a, b] = [...kinds];
  const winning = BEATS[a] === b ? a : b;
  return Object.keys(picks).filter((id) => picks[id] === winning);
}

export function winnersOf(state: RpsState): string[] {
  return state.players.filter((id) => state.wins[id] >= TARGET_WINS);
}

export function applyMove(state: RpsState, playerId: string, move: RpsMove): RpsState {
  if (winnersOf(state).length > 0) throw new GameError('這局已經結束了');
  if (move.round !== state.round) throw new GameError('這一輪已經結束了');
  if (!CHOICES.includes(move.choice)) throw new GameError('沒有這個手勢');
  if (state.picks[playerId]) throw new GameError('這一輪你已經出過了');

  const picks = { ...state.picks, [playerId]: move.choice };
  if (!state.players.every((id) => picks[id])) return { ...state, picks };

  const winners = roundWinners(picks);
  const wins = { ...state.wins };
  for (const id of winners) wins[id] += 1;
  return { ...state, round: state.round + 1, picks: {}, wins, last: { round: state.round, picks, winners } };
}

export function getResult(state: RpsState, names: Record<string, string>): GameResult | null {
  const winners = winnersOf(state);
  if (winners.length === 0) return null;
  return {
    points: Object.fromEntries(winners.map((id) => [id, 1])),
    message: `✊ ${joinNames(names, winners)} 先拿下 ${TARGET_WINS} 勝！`,
  };
}
