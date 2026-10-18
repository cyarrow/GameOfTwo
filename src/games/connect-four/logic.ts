import { GameError, type GameResult } from '../types';
import { nameOf } from '../helpers';
import { shuffle } from '../shuffle';

export const COLS = 7;
export const ROWS = 6;
export const DISCS = ['🔴', '🟡'] as const;

export type Cell = 0 | 1 | null;

export interface ConnectFourState {
  /** players[0] 是 🔴（先手） */
  players: [string, string];
  /** 由上而下、由左而右，共 ROWS × COLS 格 */
  board: Cell[];
  turn: 0 | 1;
  winner: 0 | 1 | null;
  winLine: number[] | null;
  draw: boolean;
  lastMove: number | null;
}

export interface ConnectFourMove {
  col: number;
}

export function setup(playerIds: string[], random: () => number): ConnectFourState {
  const [a, b] = shuffle(playerIds, random);
  return {
    players: [a, b],
    board: Array(ROWS * COLS).fill(null),
    turn: 0,
    winner: null,
    winLine: null,
    draw: false,
    lastMove: null,
  };
}

function findLine(board: Cell[], index: number): number[] | null {
  const who = board[index];
  const r0 = Math.floor(index / COLS);
  const c0 = index % COLS;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const line = [index];
    for (const sign of [1, -1]) {
      let r = r0 + dr * sign;
      let c = c0 + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === who) {
        line.push(r * COLS + c);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= 4) return line;
  }
  return null;
}

export function applyMove(state: ConnectFourState, playerId: string, move: ConnectFourMove): ConnectFourState {
  if (state.winner !== null || state.draw) throw new GameError('這局已經結束了');
  if (state.players[state.turn] !== playerId) throw new GameError('還沒輪到你');
  const { col } = move;
  if (!Number.isInteger(col) || col < 0 || col >= COLS) throw new GameError('沒有這一行');

  let row = ROWS - 1;
  while (row >= 0 && state.board[row * COLS + col] !== null) row--;
  if (row < 0) throw new GameError('這一行已經滿了');

  const index = row * COLS + col;
  const board = [...state.board];
  board[index] = state.turn;
  const winLine = findLine(board, index);
  return {
    ...state,
    board,
    turn: state.turn === 0 ? 1 : 0,
    winner: winLine ? state.turn : null,
    winLine,
    draw: !winLine && board.every((c) => c !== null),
    lastMove: index,
  };
}

export function getResult(state: ConnectFourState, names: Record<string, string>): GameResult | null {
  if (state.winner !== null) {
    const id = state.players[state.winner];
    return { points: { [id]: 1 }, message: `${DISCS[state.winner]} ${nameOf(names, id)} 連成四顆獲勝！` };
  }
  if (state.draw) return { points: {}, message: '四子棋平手！' };
  return null;
}
