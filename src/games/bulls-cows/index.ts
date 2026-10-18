import type { GameModule } from '../types';
import { applyMove, DIGITS, getResult, setup, type BullsCowsMove, type BullsCowsState } from './logic';
import { BullsCowsView } from './View';

export const bullsCows: GameModule<BullsCowsState, BullsCowsMove> = {
  id: 'bulls-cows',
  name: '1A2B 猜數字',
  emoji: '🔢',
  description: `大家輪流猜同一組 ${DIGITS} 位數密碼，善用別人的線索搶先猜中！`,
  rules: [
    `系統隨機產生一組 ${DIGITS} 個不重複數字的密碼。`,
    '大家輪流猜，每次猜完會顯示幾 A 幾 B：A 是數字和位置都對，B 是數字對但位置錯。',
    '所有人的猜測和結果都看得到，可以利用別人的線索。',
    '第一個猜中（4A）的人得 1 分。',
  ],
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: BullsCowsView,
};
