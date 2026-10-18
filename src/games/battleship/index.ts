import type { GameModule } from '../types';
import { applyMove, getResult, setup, SHIPS, SIZE, type BattleshipMove, type BattleshipState } from './logic';
import { BattleshipView } from './View';

export const battleship: GameModule<BattleshipState, BattleshipMove> = {
  id: 'battleship',
  name: '海戰棋',
  emoji: '🚢',
  description: '各自藏好艦隊，輪流開砲猜對方的船在哪，先擊沉全部敵艦的人獲勝。',
  rules: [
    `每人在 ${SIZE}×${SIZE} 的海域有 ${SHIPS.length} 艘船（長度 ${SHIPS.join('、')} 格），位置自動擺放，可以重新擺放到滿意為止。`,
    '雙方都按「準備好了」後開始，輪流朝對方海域開一砲。',
    '💥 是命中、· 是沒打中；一艘船的格子全被打中就沉了。',
    '先擊沉對方全部船艦的人得 1 分。',
  ],
  minPlayers: 2,
  maxPlayers: 2,
  setup,
  applyMove,
  getResult,
  View: BattleshipView,
};
