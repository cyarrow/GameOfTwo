import type { GameModule } from '../types';
import { applyMove, currentPlayer, getResult, setup, SIZE, type DotsBoxesMove, type DotsBoxesState } from './logic';
import { DotsBoxesView } from './View';

export const dotsBoxes: GameModule<DotsBoxesState, DotsBoxesMove> = {
  id: 'dots-boxes',
  name: '點格棋',
  emoji: '🔲',
  description: '輪流在點之間畫線，圍出格子就得分還能再畫一次。',
  rules: [
    `棋盤有 ${SIZE} × ${SIZE} 個格子，大家輪流在相鄰的兩點之間畫一條線。`,
    '畫下一個格子的第四條邊，就佔領那一格，而且可以再畫一條。',
    '小心不要畫第三條邊，會送對手格子！',
    '格子都被佔領後，佔最多格的人得 1 分（同分一起得分）。',
  ],
  category: '策略',
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  whoseTurn: currentPlayer,
  View: DotsBoxesView,
};
