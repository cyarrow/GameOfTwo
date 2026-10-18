import { GameError, type GameResult } from '../types';
import { nameOf } from '../helpers';
import { shuffle } from '../shuffle';

export const SIZE = 8;
export const DISCS = ['⚫', '⚪'] as const;
export type Cell = 0 | 1 | null;

export interface OthelloState {
  /** players[0] 是黑棋（先手） */
  players: [string, string];
  board: Cell[];
  turn: 0 | 1;
  /** 上一位玩家沒地方下而被跳過時記錄下來，給畫面提示 */
  passed: 0 | 1 | null;
  over: boolean;
  lastMove: number | null;
}

export interface OthelloMove {
  cell: number;
}

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export function setup(playerIds: string[], random: () => number): OthelloState {
  const [a, b] = shuffle(playerIds, random);
  const board: Cell[] = Array(SIZE * SIZE).fill(null);
  const mid = SIZE / 2;
  board[(mid - 1) * SIZE + mid - 1] = 1;
  board[mid * SIZE + mid] = 1;
  board[(mid - 1) * SIZE + mid] = 0;
  board[mid * SIZE + mid - 1] = 0;
  return { players: [a, b], board, turn: 0, passed: null, over: false, lastMove: null };
}

/** 在 cell 放下 who 的棋子會翻轉哪些棋子 */
export function flipsFor(board: Cell[], cell: number, who: 0 | 1): number[] {
  if (board[cell] !== null) return [];
  const r0 = Math.floor(cell / SIZE);
  const c0 = cell % SIZE;
  const flips: number[] = [];
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let r = r0 + dr;
    let c = c0 + dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === 1 - who) {
      line.push(r * SIZE + c);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === who) flips.push(...line);
  }
  return flips;
}

export function legalMoves(board: Cell[], who: 0 | 1): number[] {
  return board.map((_, i) => i).filter((i) => flipsFor(board, i, who).length > 0);
}

export function counts(board: Cell[]): [number, number] {
  return [board.filter((c) => c === 0).length, board.filter((c) => c === 1).length];
}

export function applyMove(state: OthelloState, playerId: string, move: OthelloMove): OthelloState {
  if (state.over) throw new GameError('這局已經結束了');
  if (state.players[state.turn] !== playerId) throw new GameError('還沒輪到你');
  const { cell } = move;
  if (!Number.isInteger(cell) || cell < 0 || cell >= SIZE * SIZE) throw new GameError('沒有這一格');
  const flips = flipsFor(state.board, cell, state.turn);
  if (flips.length === 0) throw new GameError('這裡不能下，要能夾住對方的棋子');

  const board = [...state.board];
  board[cell] = state.turn;
  for (const i of flips) board[i] = state.turn;

  const other = state.turn === 0 ? 1 : 0;
  // 對手沒地方下就跳過對手；兩邊都沒地方下就結束
  if (legalMoves(board, other).length > 0) return { ...state, board, turn: other, passed: null, lastMove: cell };
  if (legalMoves(board, state.turn).length > 0) return { ...state, board, passed: other, lastMove: cell };
  return { ...state, board, over: true, passed: null, lastMove: cell };
}

export function getResult(state: OthelloState, names: Record<string, string>): GameResult | null {
  if (!state.over) return null;
  const [black, white] = counts(state.board);
  if (black === white) return { points: {}, message: `黑白棋平手（${black} : ${white}）！` };
  const w = black > white ? 0 : 1;
  const id = state.players[w];
  return { points: { [id]: 1 }, message: `${DISCS[w]} ${nameOf(names, id)} 以 ${black} : ${white} 獲勝！` };
}
