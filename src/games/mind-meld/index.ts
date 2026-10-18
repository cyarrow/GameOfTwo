import type { GameModule } from '../types';
import { applyMove, getResult, ROUNDS, setup, type MindMeldMove, type MindMeldState } from './logic';
import { MindMeldView } from './View';

export const mindMeld: GameModule<MindMeldState, MindMeldMove> = {
  id: 'mind-meld',
  name: '默契大考驗',
  emoji: '🧠',
  description: '同一題大家各自作答，跟別人選一樣就得分，看誰跟大家最有默契！',
  rules: [
    `總共 ${ROUNDS} 題，每題有 4 個選項。`,
    '大家同時作答，全員作答後才會公布每個人選了什麼。',
    '你跟幾個人選一樣，這題就得幾分。',
    '默契分最高的人得 1 分；大家同分的話全員各得 1 分。',
  ],
  minPlayers: 2,
  maxPlayers: 4,
  setup,
  applyMove,
  getResult,
  View: MindMeldView,
};
