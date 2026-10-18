import type { GameModule } from '../types';
import { applyMove, getResult, MAX, MIN, setup, type GuessBombMove, type GuessBombState } from './logic';
import { GuessBombView } from './View';

export const guessBomb: GameModule<GuessBombState, GuessBombMove> = {
  id: 'guess-bomb',
  name: '終極密碼',
  emoji: '💣',
  description: `密碼藏在 ${MIN}～${MAX} 之間，輪流猜數字縮小範圍，猜中的人就爆炸！`,
  rules: [
    `系統會隨機在 ${MIN}～${MAX} 之間藏一個密碼（炸彈）。`,
    '大家依隨機順序輪流猜一個在目前範圍內的數字。',
    '沒猜中的話，範圍會往密碼的方向縮小。',
    '猜中密碼的人輸，其他人各得 1 分。',
  ],
  category: '派對',
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: GuessBombView,
};
