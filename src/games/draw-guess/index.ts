import type { GameModule } from '../types';
import { applyMove, getResult, setup, type DrawGuessMove, type DrawGuessState } from './logic';
import { DrawGuessView } from './View';

export const drawGuess: GameModule<DrawGuessState, DrawGuessMove> = {
  id: 'draw-guess',
  name: '你畫我猜',
  emoji: '🎨',
  description: '輪流畫畫，其他人搶答，畫得好又猜得快的人獲勝！',
  rules: [
    '大家輪流當畫家（2 人時每人畫兩題），只有畫家看得到題目。',
    '畫家每畫完一筆，其他人的畫面就會更新；其他人在下方輸入答案。',
    '第一個猜對的得 2 分，之後猜對的得 1 分；每有一人猜對，畫家也得 1 分。',
    '所有人都猜對、或畫家按「放棄這題」，就公布答案。',
    '全部題目結束後，總分最高的人得 1 分。',
  ],
  category: '派對',
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: DrawGuessView,
};
