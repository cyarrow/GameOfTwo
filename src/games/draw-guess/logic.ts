import { EMPTY_CONTENT, pickMixed, type CustomContent } from '../../banks';
import { GameError, type GameResult } from '../types';
import { joinNames, pointsForTop } from '../helpers';
import { shuffle } from '../shuffle';
import { WORDS } from './words';

export const CANVAS_SIZE = 1000;
const MAX_STROKES = 400;
const MAX_POINTS = 1000;
const MAX_GUESS_LENGTH = 20;
export const COLORS = ['#222222', '#e8505b', '#3f8efc', '#22b07d', '#f5a524', '#8e5bd8', '#8b5a2b', '#ffffff'];

export interface Stroke {
  /** 顏色在 COLORS 裡的編號 */
  c: number;
  /** 粗細 */
  w: number;
  /** 攤平的座標 [x0, y0, x1, y1, ...]，範圍 0..CANVAS_SIZE */
  p: number[];
}

export interface Guess {
  by: string;
  text: string;
  correct: boolean;
}

export interface DrawGuessState {
  players: string[];
  /** 每一題由誰畫 */
  drawers: string[];
  words: string[];
  round: number;
  strokes: Stroke[];
  guesses: Guess[];
  solved: string[];
  revealed: boolean;
  scores: Record<string, number>;
}

export type DrawGuessMove =
  | { type: 'stroke'; round: number; stroke: Stroke }
  | { type: 'clear'; round: number }
  | { type: 'guess'; round: number; text: string }
  | { type: 'skip'; round: number }
  | { type: 'next'; round: number };

export function setup(playerIds: string[], random: () => number, custom: CustomContent = EMPTY_CONTENT): DrawGuessState {
  // 2 人時每人畫兩題，其他人數每人畫一題
  const order = shuffle(playerIds, random);
  const drawers = playerIds.length === 2 ? [...order, ...order] : order;
  return {
    players: playerIds,
    drawers,
    words: pickMixed(custom.drawGuess, WORDS, drawers.length, random),
    round: 0,
    strokes: [],
    guesses: [],
    solved: [],
    revealed: false,
    scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
  };
}

export function drawerOf(state: DrawGuessState): string {
  return state.drawers[state.round];
}

export function isFinished(state: DrawGuessState): boolean {
  return state.revealed && state.round === state.drawers.length - 1;
}

export function normalizeGuess(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

function isValidStroke(stroke: Stroke): boolean {
  return (
    Number.isInteger(stroke?.c) &&
    stroke.c >= 0 &&
    stroke.c < COLORS.length &&
    typeof stroke.w === 'number' &&
    stroke.w > 0 &&
    stroke.w <= 60 &&
    Array.isArray(stroke.p) &&
    stroke.p.length >= 2 &&
    stroke.p.length <= MAX_POINTS * 2 &&
    stroke.p.length % 2 === 0 &&
    stroke.p.every((v) => Number.isInteger(v) && v >= 0 && v <= CANVAS_SIZE)
  );
}

export function applyMove(state: DrawGuessState, playerId: string, move: DrawGuessMove): DrawGuessState {
  if (isFinished(state)) throw new GameError('這局已經結束了');
  if (move.round !== state.round) throw new GameError('題目已經換了');
  const drawer = drawerOf(state);
  const isDrawer = playerId === drawer;

  switch (move.type) {
    case 'next':
      if (!state.revealed) throw new GameError('這題還沒結束');
      return { ...state, round: state.round + 1, strokes: [], guesses: [], solved: [], revealed: false };

    case 'stroke':
    case 'clear':
    case 'skip':
      if (!isDrawer) throw new GameError('只有畫畫的人可以這樣做');
      if (state.revealed) throw new GameError('這題已經結束了');
      if (move.type === 'skip') return { ...state, revealed: true };
      if (move.type === 'clear') return { ...state, strokes: [] };
      if (!isValidStroke(move.stroke)) throw new GameError('筆畫資料不正確');
      if (state.strokes.length >= MAX_STROKES) throw new GameError('筆畫太多了，先清除畫布吧');
      return { ...state, strokes: [...state.strokes, move.stroke] };

    case 'guess': {
      if (isDrawer) throw new GameError('畫畫的人不能猜');
      if (state.revealed) throw new GameError('這題已經結束了');
      if (state.solved.includes(playerId)) throw new GameError('你已經猜對了');
      const text = move.text.trim().slice(0, MAX_GUESS_LENGTH);
      if (!text) throw new GameError('請輸入答案');

      const correct = normalizeGuess(text) === normalizeGuess(state.words[state.round]);
      const guesses = [...state.guesses, { by: playerId, text, correct }];
      if (!correct) return { ...state, guesses };

      // 第一個猜對的 2 分，之後猜對的 1 分；畫的人每有一個人猜對得 1 分
      const scores = { ...state.scores };
      scores[playerId] += state.solved.length === 0 ? 2 : 1;
      scores[drawer] += 1;
      const solved = [...state.solved, playerId];
      const guessers = state.players.filter((id) => id !== drawer);
      return { ...state, guesses, scores, solved, revealed: guessers.every((id) => solved.includes(id)) };
    }
  }
}

export function getResult(state: DrawGuessState, names: Record<string, string>): GameResult | null {
  if (!isFinished(state)) return null;
  const { winners, points } = pointsForTop(state.scores);
  const message =
    winners.length === 0
      ? '🎨 這局沒有人猜對任何一題…'
      : `🎨 ${joinNames(names, winners)} 以 ${state.scores[winners[0]]} 分獲勝！`;
  return { points, message };
}
