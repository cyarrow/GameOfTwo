import type { GameResult } from '../games/types';

export const MAX_PLAYERS = 4;

export interface PlayerInfo {
  name: string;
  joinedAt: number;
  online: boolean;
}

/**
 * 資料庫裡實際存的房間資料。match 與 history 存成 JSON 字串，
 * 避免 Firebase 自動刪掉空陣列或 null 這類行為影響遊戲狀態。
 */
export interface RoomRecord {
  createdAt: number;
  players?: Record<string, PlayerInfo>;
  scores?: Record<string, number>;
  match?: string;
  history?: string;
}

export interface MatchData {
  id: string;
  gameId: string;
  playerIds: string[];
  state: unknown;
  result: GameResult | null;
  startedAt: number;
}

export interface HistoryEntry {
  gameId: string;
  message: string;
  at: number;
}

export interface Player extends PlayerInfo {
  id: string;
}

/** 整理過、方便畫面使用的房間資料 */
export interface Room {
  code: string;
  players: Player[];
  hostId: string | null;
  scores: Record<string, number>;
  match: MatchData | null;
  history: HistoryEntry[];
}
