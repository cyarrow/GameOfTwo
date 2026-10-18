import type { GameModule } from '../types';
import { applyMove, DURATION_SECONDS, getResult, setup, type TapRaceMove, type TapRaceState } from './logic';
import { TapRaceView } from './View';

export const tapRace: GameModule<TapRaceState, TapRaceMove> = {
  id: 'tap-race',
  name: '連打大賽',
  emoji: '👆',
  description: `${DURATION_SECONDS} 秒內比誰點得多，手指準備好了嗎？`,
  rules: [
    '全員按下「準備」後，倒數 3 秒開始。',
    `${DURATION_SECONDS} 秒內狂點按鈕（電腦也可以按空白鍵）。`,
    '點最多下的人得 1 分。',
  ],
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: TapRaceView,
};
