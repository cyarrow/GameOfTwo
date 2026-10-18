import type { GameModule } from '../types';
import { applyMove, currentPlayer, DICE_PER_PLAYER, getResult, setup, type LiarDiceMove, type LiarDiceState } from './logic';
import { LiarDiceView } from './View';

export const liarDice: GameModule<LiarDiceState, LiarDiceMove> = {
  id: 'liar-dice',
  name: '吹牛骰子',
  emoji: '🎲',
  description: '每人 5 顆骰子只有自己看得到，輪流喊數量，不信就「開」！',
  rules: [
    `每人 ${DICE_PER_PLAYER} 顆骰子，只看得到自己的。`,
    '輪流喊「全場至少有幾個某點數」，例如「4 個 5」。第一口至少要喊玩家人數個。',
    '下一個人要喊得更大：數量更多，或數量相同但點數更大。',
    '1 是萬用骰，可以當任何點數，所以不能喊 1。',
    '不相信上一口的話就喊「開」：實際數量不足，喊的人輸；否則開的人輸。',
    '輸的人 0 分，其他人各得 1 分。',
  ],
  category: '派對',
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  whoseTurn: (s) => (s.reveal ? null : currentPlayer(s)),
  View: LiarDiceView,
};
