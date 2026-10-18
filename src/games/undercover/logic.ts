import { GameError, type GameResult } from '../types';
import { nameOf } from '../helpers';
import { shuffle } from '../shuffle';
import { WORD_PAIRS } from './words';

const MAX_DESCRIPTION = 30;
/** 一直平票的話，撐過這麼多輪的臥底獲勝 */
export const MAX_ROUNDS = 4;

export interface Description {
  round: number;
  by: string;
  text: string;
}

export interface VoteResult {
  round: number;
  votes: Record<string, string>;
  /** 被淘汰的人；平票時沒有人淘汰 */
  out: string | null;
}

export interface UndercoverState {
  /** 描述的順序 */
  order: string[];
  spy: string;
  /** [平民的詞, 臥底的詞] */
  words: [string, string];
  alive: string[];
  round: number;
  phase: 'describe' | 'vote';
  /** 這一輪描述到第幾位（在存活的人裡面） */
  turn: number;
  descriptions: Description[];
  votes: Record<string, string>;
  voteLog: VoteResult[];
  winner: 'civilians' | 'spy' | null;
}

export type UndercoverMove = { type: 'describe'; round: number; text: string } | { type: 'vote'; round: number; target: string };

export function setup(playerIds: string[], random: () => number): UndercoverState {
  const pair = WORD_PAIRS[Math.floor(random() * WORD_PAIRS.length)];
  const words: [string, string] = random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
  const order = shuffle(playerIds, random);
  return {
    order,
    spy: playerIds[Math.floor(random() * playerIds.length)],
    words,
    alive: order,
    round: 1,
    phase: 'describe',
    turn: 0,
    descriptions: [],
    votes: {},
    voteLog: [],
    winner: null,
  };
}

export function wordOf(state: UndercoverState, id: string): string {
  return id === state.spy ? state.words[1] : state.words[0];
}

export function currentDescriber(state: UndercoverState): string | null {
  return state.phase === 'describe' ? state.alive[state.turn] : null;
}

function tally(votes: Record<string, string>): string | null {
  const counts: Record<string, number> = {};
  for (const target of Object.values(votes)) counts[target] = (counts[target] ?? 0) + 1;
  const max = Math.max(...Object.values(counts));
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  return top.length === 1 ? top[0] : null;
}

export function applyMove(state: UndercoverState, playerId: string, move: UndercoverMove): UndercoverState {
  if (state.winner) throw new GameError('這局已經結束了');
  if (move.round !== state.round) throw new GameError('這一輪已經結束了');
  if (!state.alive.includes(playerId)) throw new GameError('你已經被淘汰了');

  if (move.type === 'describe') {
    if (state.phase !== 'describe') throw new GameError('現在是投票時間');
    if (currentDescriber(state) !== playerId) throw new GameError('還沒輪到你');
    const text = (move.text ?? '').trim().slice(0, MAX_DESCRIPTION);
    if (!text) throw new GameError('請輸入描述');
    if (text.includes(wordOf(state, playerId))) throw new GameError('不能直接說出你的詞！');
    const descriptions = [...state.descriptions, { round: state.round, by: playerId, text }];
    const turn = state.turn + 1;
    if (turn < state.alive.length) return { ...state, descriptions, turn };
    return { ...state, descriptions, turn: 0, phase: 'vote', votes: {} };
  }

  if (state.phase !== 'vote') throw new GameError('還在描述階段');
  if (playerId in state.votes) throw new GameError('你已經投過票了');
  if (move.target === playerId || !state.alive.includes(move.target)) throw new GameError('不能投給這個人');

  const votes = { ...state.votes, [playerId]: move.target };
  if (!state.alive.every((id) => id in votes)) return { ...state, votes };

  const out = tally(votes);
  const alive = out ? state.alive.filter((id) => id !== out) : state.alive;
  const voteLog = [...state.voteLog, { round: state.round, votes, out }];
  let winner: UndercoverState['winner'] = null;
  if (out === state.spy) winner = 'civilians';
  else if (alive.length <= 2 || state.round >= MAX_ROUNDS) winner = 'spy';
  return { ...state, alive, voteLog, votes: {}, winner, round: winner ? state.round : state.round + 1, phase: 'describe', turn: 0 };
}

export function getResult(state: UndercoverState, names: Record<string, string>): GameResult | null {
  if (!state.winner) return null;
  const [civ, spyWord] = state.words;
  const spyName = nameOf(names, state.spy);
  if (state.winner === 'civilians') {
    return {
      points: Object.fromEntries(state.order.filter((id) => id !== state.spy).map((id) => [id, 1])),
      message: `🕵️ 抓到臥底 ${spyName} 了！平民的詞是「${civ}」，臥底的詞是「${spyWord}」`,
    };
  }
  return {
    points: { [state.spy]: 1 },
    message: `🕵️ 臥底 ${spyName} 成功躲過！平民的詞是「${civ}」，臥底的詞是「${spyWord}」`,
  };
}
