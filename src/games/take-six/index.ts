import type { GameModule } from '../types';
import { applyMove, getResult, HAND_SIZE, setup, type TakeSixMove, type TakeSixState } from './logic';
import { TakeSixView } from './View';

export const takeSix: GameModule<TakeSixState, TakeSixMove> = {
  id: 'take-six',
  name: '誰是牛頭王',
  emoji: '🐮',
  description: '大家同時出牌，放到第 6 張的人要收走整排牛頭，牛頭最少的人獲勝。',
  rules: [
    `每人 ${HAND_SIZE} 張牌，桌上有 4 排，每排先放 1 張。`,
    '每輪大家同時選一張牌，全員選好後由小到大依序放牌。',
    '牌會放到「結尾比它小、而且最接近」的那一排後面。',
    '放下的是那排第 6 張的話，要收走前 5 張，自己那張變成新的開頭。',
    '牌比每排結尾都小的話，自動收走牛頭最少的那一排。',
    '每張牌有 1～7 個牛頭（🐮）。打完全部手牌後，收到牛頭最少的人得 1 分。',
  ],
  category: '卡牌',
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: TakeSixView,
};
