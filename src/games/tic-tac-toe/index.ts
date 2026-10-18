import type { GameModule } from '../types';
import { applyMove, getResult, setup, type TicTacToeMove, type TicTacToeState } from './logic';
import { TicTacToeView } from './View';

export const ticTacToe: GameModule<TicTacToeState, TicTacToeMove> = {
  id: 'tic-tac-toe',
  name: '井字遊戲',
  emoji: '⭕',
  description: '經典的圈圈叉叉，先連成一線的人獲勝。',
  rules: ['隨機決定誰是先手 ⭕。', '輪流在空格下棋。', '橫、直、斜任一方向先連成三個的人獲勝，得 1 分。'],
  category: '策略',
  minPlayers: 2,
  maxPlayers: 2,
  setup,
  applyMove,
  getResult,
  View: TicTacToeView,
};
