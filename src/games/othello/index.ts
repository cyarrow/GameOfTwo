import type { GameModule } from '../types';
import { applyMove, getResult, setup, type OthelloMove, type OthelloState } from './logic';
import { OthelloView } from './View';

export const othello: GameModule<OthelloState, OthelloMove> = {
  id: 'othello',
  name: '黑白棋',
  emoji: '⚫',
  description: '夾住對方的棋子就能翻成自己的顏色，最後棋子多的人獲勝。',
  rules: [
    '隨機決定誰是黑棋（先手）。',
    '下棋時必須在任一方向夾住對方的棋子，被夾住的棋子會翻成你的顏色。',
    '沒地方下的話會自動跳過，兩邊都沒地方下時結束。',
    '棋子比較多的人得 1 分。',
  ],
  minPlayers: 2,
  maxPlayers: 2,
  setup,
  applyMove,
  getResult,
  View: OthelloView,
};
