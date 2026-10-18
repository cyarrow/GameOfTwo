import type { GameModule } from '../types';
import { applyMove, getResult, HAND_SIZE, setup, type ColorChainMove, type ColorChainState } from './logic';
import { ColorChainView } from './View';

export const colorChain: GameModule<ColorChainState, ColorChainMove> = {
  id: 'color-chain',
  name: '顏色接龍',
  emoji: '🌈',
  description: '類似 UNO：出同顏色或同數字的牌，搭配功能牌整人，先出完手牌的人獲勝！',
  rules: [
    `每人 ${HAND_SIZE} 張牌。輪到你時，出一張跟上一張「同顏色」或「同數字/符號」的牌。`,
    '功能牌：⊘ 跳過下一位、⇄ 迴轉順序（2 人時等於跳過）、+2 下一位抽兩張並跳過。',
    '萬用牌 🌈 隨時可以出並指定顏色；+4 同時讓下一位抽四張並跳過。',
    '沒牌可出就抽一張，抽到能出的牌可以馬上出，不然就換下一位。',
    '第一個出完手牌的人得 1 分。',
  ],
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: ColorChainView,
};
