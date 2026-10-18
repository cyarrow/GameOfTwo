import { GameError, type GameResult } from '../types';
import { shuffle } from '../shuffle';

export type Cell = 0 | 1 | null;

export interface TicTacToeState {
  /** players[0] 是 ⭕（先手），players[1] 是 ❌ */
  players: [string, string];
  board: Cell[];
  turn: 0 | 1;
  winner: 0 | 1 | null;
  winLine: number[] | null;
  draw: boolean;
}

export interface TicTacToeMove {
  cell: number;
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const MARKS = ['⭕', '❌'] as const;

export function setup(playerIds: string[], random: () => number): TicTacToeState {
  const [a, b] = shuffle(playerIds, random);
  return { players: [a, b], board: Array(9).fill(null), turn: 0, winner: null, winLine: null, draw: false };
}

export function applyMove(state: TicTacToeState, playerId: string, move: TicTacToeMove): TicTacToeState {
  if (state.winner !== null || state.draw) throw new GameError('這局已經結束了');
  if (state.players[state.turn] !== playerId) throw new GameError('還沒輪到你');
  const { cell } = move;
  if (!Number.isInteger(cell) || cell < 0 || cell > 8 || state.board[cell] !== null) {
    throw new GameError('這格不能下');
  }

  const board = [...state.board];
  board[cell] = state.turn;
  const winLine = LINES.find((line) => line.every((i) => board[i] === state.turn)) ?? null;
  return {
    ...state,
    board,
    turn: state.turn === 0 ? 1 : 0,
    winner: winLine ? state.turn : null,
    winLine,
    draw: !winLine && board.every((c) => c !== null),
  };
}

export function getResult(state: TicTacToeState, names: Record<string, string>): GameResult | null {
  if (state.winner !== null) {
    const id = state.players[state.winner];
    return { points: { [id]: 1 }, message: `${MARKS[state.winner]} ${names[id] ?? '某位玩家'} 贏得井字遊戲！` };
  }
  if (state.draw) return { points: {}, message: '井字遊戲平手！' };
  return null;
}
