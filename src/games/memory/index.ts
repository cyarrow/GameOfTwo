import type { GameModule } from '../types';
import { applyMove, getResult, PAIRS, setup, type MemoryMove, type MemoryState } from './logic';
import { MemoryView } from './View';

export const memory: GameModule<MemoryState, MemoryMove> = {
  id: 'memory',
  name: '記憶翻牌',
  emoji: '🃏',
  description: '輪流翻兩張牌，翻到一樣的就拿走，比誰記性好。',
  rules: [
    `桌上有 ${PAIRS * 2} 張蓋著的牌，共 ${PAIRS} 對。`,
    '輪到你時翻兩張牌：一樣就拿走並再翻一次；不一樣就換下一位。',
    '沒配對成功的牌會保持翻開，直到下一位玩家翻牌，大家都看得到，記好位置！',
    '配對最多的人得 1 分（同分一起得分）。',
  ],
  category: '卡牌',
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: MemoryView,
};
