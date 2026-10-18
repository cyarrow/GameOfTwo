import { EMPTY_CONTENT, pickMixed, type CustomContent } from '../../banks';
import { GameError, type GameResult } from '../types';
import { joinNames, pointsForTop } from '../helpers';
import { QUESTIONS, type Question } from './questions';

export const ROUNDS = 5;

export interface MindMeldState {
  players: string[];
  /** 這局抽到的題目（舊版存的是內建題庫的編號，畫面上用 questionAt 讀取） */
  questions: (Question | number)[];
  round: number;
  /** answers[第幾題][玩家 id] = 選項編號 */
  answers: Record<string, number>[];
  revealed: boolean;
  scores: Record<string, number>;
}

export type MindMeldMove = { type: 'answer'; round: number; option: number } | { type: 'next'; round: number };

export function setup(playerIds: string[], random: () => number, custom: CustomContent = EMPTY_CONTENT): MindMeldState {
  const questions = pickMixed(custom.mindMeld, QUESTIONS, ROUNDS, random, (q) => q.q);
  return {
    players: playerIds,
    questions,
    round: 0,
    answers: questions.map(() => ({})),
    revealed: false,
    scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
  };
}

export function questionAt(state: MindMeldState, round: number): Question {
  const q = state.questions[round];
  return typeof q === 'number' ? QUESTIONS[q] : q;
}

export function isFinished(state: MindMeldState): boolean {
  return state.revealed && state.round === state.questions.length - 1;
}

export function applyMove(state: MindMeldState, playerId: string, move: MindMeldMove): MindMeldState {
  if (isFinished(state)) throw new GameError('這局已經結束了');
  // 舊的點擊（例如別人已經按了下一題）直接忽略
  if (move.round !== state.round) throw new GameError('題目已經換了');

  if (move.type === 'next') {
    if (!state.revealed) throw new GameError('還有人沒作答');
    return { ...state, round: state.round + 1, revealed: false };
  }

  if (state.revealed) throw new GameError('這題已經公布答案了');
  if (!Number.isInteger(move.option) || move.option < 0 || move.option > 3) throw new GameError('沒有這個選項');

  const current = { ...state.answers[state.round], [playerId]: move.option };
  const answers = state.answers.map((a, i) => (i === state.round ? current : a));
  const allAnswered = state.players.every((id) => id in current);
  if (!allAnswered) return { ...state, answers };

  // 全員作答：每位玩家跟幾個人選一樣，就得幾分
  const scores = { ...state.scores };
  for (const id of state.players) {
    scores[id] += state.players.filter((other) => other !== id && current[other] === current[id]).length;
  }
  return { ...state, answers, scores, revealed: true };
}

export function getResult(state: MindMeldState, names: Record<string, string>): GameResult | null {
  if (!isFinished(state)) return null;
  const { winners, points } = pointsForTop(state.scores);
  let message: string;
  if (winners.length === 0) message = '🧠 這局完全沒有默契…';
  else if (winners.length === state.players.length) message = `🧠 大家默契一樣好（各 ${state.scores[winners[0]]} 分），全員得 1 分！`;
  else message = `🧠 ${joinNames(names, winners)} 最有默契（${state.scores[winners[0]]} 分）！`;
  return { points, message };
}
