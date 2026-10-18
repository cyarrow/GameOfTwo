import type { GameModule } from '../types';
import { applyMove, getResult, setup, TARGET_WINS, type RpsMove, type RpsState } from './logic';
import { RpsView } from './View';

export const rps: GameModule<RpsState, RpsMove> = {
  id: 'rps',
  name: '剪刀石頭布',
  emoji: '✊',
  description: `大家同時出拳，先贏 ${TARGET_WINS} 輪的人獲勝。`,
  rules: [
    '每輪大家同時出拳，全員出完才會公布。',
    '只出現兩種手勢時才分勝負，出贏的人各拿 1 勝；三種都有或全部一樣算平手。',
    `先拿到 ${TARGET_WINS} 勝的人得 1 分（同時達到就一起得分）。`,
  ],
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: RpsView,
};
