import type { GameModule } from '../types';
import { applyMove, getResult, ROUNDS, setup, type ReactionMove, type ReactionState } from './logic';
import { ReactionView } from './View';

export const reaction: GameModule<ReactionState, ReactionMove> = {
  id: 'reaction',
  name: '反應力對決',
  emoji: '⚡',
  description: '畫面變綠的瞬間按下去，比誰反應最快！太早按就輸了這輪。',
  rules: [
    `總共 ${ROUNDS} 輪。每輪畫面先是紅色，隨機幾秒後變成綠色。`,
    '變綠後越快按越好；還沒變綠就按算犯規。',
    '時間是在自己的裝置上計算，不受網路快慢影響。',
    '每輪最快的人贏一輪，贏最多輪的人得 1 分。',
  ],
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: ReactionView,
};
