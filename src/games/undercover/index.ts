import type { GameModule } from '../types';
import { applyMove, getResult, setup, type UndercoverMove, type UndercoverState } from './logic';
import { UndercoverView } from './View';

export const undercover: GameModule<UndercoverState, UndercoverMove> = {
  id: 'undercover',
  name: '誰是臥底',
  emoji: '🕵️',
  description: '每人拿到一個詞，臥底的詞跟大家有點不一樣。輪流描述、投票抓出臥底！',
  rules: [
    '每人會拿到一個詞，其中一人是臥底，拿到的詞跟大家相似但不同。連臥底自己都不知道自己是臥底！',
    '依序用一句話描述自己的詞，不能直接說出那個詞。',
    '描述完大家投票，得票最多的人淘汰；平票就沒有人淘汰。',
    '淘汰到臥底，平民全體各得 1 分；臥底撐到只剩 2 人（或撐過 4 輪），臥底得 1 分。',
  ],
  category: '派對',
  minPlayers: 3,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: UndercoverView,
};
