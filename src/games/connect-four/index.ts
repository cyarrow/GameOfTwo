import type { GameModule } from '../types';
import { applyMove, getResult, setup, type ConnectFourMove, type ConnectFourState } from './logic';
import { ConnectFourView } from './View';

export const connectFour: GameModule<ConnectFourState, ConnectFourMove> = {
  id: 'connect-four',
  name: '四子棋',
  emoji: '🔴',
  description: '棋子會往下掉，先把四顆連成一線的人獲勝。',
  rules: ['隨機決定誰是先手 🔴。', '輪流選一行放棋子，棋子會掉到那一行最下面的空位。', '橫、直、斜任一方向先連成四顆的人獲勝，得 1 分。'],
  category: '策略',
  minPlayers: 2,
  maxPlayers: 2,
  setup,
  applyMove,
  getResult,
  View: ConnectFourView,
};
