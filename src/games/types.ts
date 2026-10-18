import type { ComponentType } from 'react';
import type { CustomContent } from '../banks';

export type GameCategory = '派對' | '卡牌' | '反應' | '策略';

/** 一局結束時的結果：每位玩家這局得到的分數，以及顯示給大家看的訊息。 */
export interface GameResult {
  points: Record<string, number>;
  message: string;
}

/** 玩家做了不合法的動作（例如還沒輪到該玩家）。訊息會直接顯示給該玩家。 */
export class GameError extends Error {}

export interface GameViewProps<S, M> {
  state: S;
  /** 這局參與的玩家，依加入房間的順序排列 */
  playerIds: string[];
  /** 自己的 id；如果自己只是觀戰（開局後才加入）則為 null */
  me: string | null;
  names: Record<string, string>;
  /** 送出動作；不合法時回傳錯誤訊息，成功則回傳 null */
  sendMove: (move: M) => Promise<string | null>;
  finished: boolean;
}

/**
 * 每個小遊戲都實作這個介面，平台本身不需要知道遊戲細節。
 * setup / applyMove / getResult 必須是純函式（不能有副作用），
 * 因為它們會在資料庫交易中執行，可能被重試好幾次。
 */
export interface GameModule<S, M> {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rules: string[];
  /** 大廳分類篩選用 */
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  /** custom：自訂題庫的內容，有用到題庫的遊戲才需要 */
  setup(playerIds: string[], random: () => number, custom: CustomContent): S;
  /** 回傳新的狀態；動作不合法時丟出 GameError */
  applyMove(state: S, playerId: string, move: M): S;
  getResult(state: S, names: Record<string, string>): GameResult | null;
  /** 輪流制的遊戲：現在輪到誰。平台用來在輪到你時發光提示並輕震；同時行動的遊戲不用提供 */
  whoseTurn?(state: S): string | null;
  View: ComponentType<GameViewProps<S, M>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGame = GameModule<any, any>;
