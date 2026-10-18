import { getGame } from '../games/registry';
import { GameError } from '../games/types';
import type { HistoryEntry, MatchData, Player, Room, RoomRecord } from './types';
import { MAX_PLAYERS } from './types';

/**
 * 房間的狀態轉換。這裡全部是純函式，方便測試，
 * 也能直接放進資料庫交易裡執行。失敗時丟出 RoomError。
 */
export class RoomError extends Error {}

const HISTORY_LIMIT = 20;

export function sortedPlayers(record: RoomRecord): Player[] {
  return Object.entries(record.players ?? {})
    .map(([id, p]) => ({ id, ...p }))
    // 忽略不完整的資料（例如離開後才觸發的斷線紀錄）
    .filter((p) => typeof p.name === 'string')
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

/** 房主 = 最早加入且目前在線上的玩家。房主離線時會自動交給下一位。 */
export function hostOf(record: RoomRecord): string | null {
  return sortedPlayers(record).find((p) => p.online)?.id ?? null;
}

export function decodeMatch(record: RoomRecord): MatchData | null {
  return record.match ? (JSON.parse(record.match) as MatchData) : null;
}

export function decodeHistory(record: RoomRecord): HistoryEntry[] {
  return record.history ? (JSON.parse(record.history) as HistoryEntry[]) : [];
}

export function toRoom(code: string, record: RoomRecord): Room {
  return {
    code,
    players: sortedPlayers(record),
    hostId: hostOf(record),
    scores: record.scores ?? {},
    match: decodeMatch(record),
    history: decodeHistory(record),
  };
}

function isActiveMatch(match: MatchData | null): match is MatchData {
  return match !== null && match.result === null;
}

export function newRoom(playerId: string, name: string, now: number): RoomRecord {
  return {
    createdAt: now,
    players: { [playerId]: { name, joinedAt: now, online: true } },
    scores: { [playerId]: 0 },
  };
}

export function join(record: RoomRecord, playerId: string, name: string, now: number): RoomRecord {
  const players = { ...record.players };
  const scores = { ...record.scores };
  const existing = players[playerId];
  if (existing?.name) {
    players[playerId] = { ...existing, name, online: true };
    return { ...record, players };
  }

  if (Object.keys(players).length >= MAX_PLAYERS) {
    // 房間滿了：把離線、而且沒有在進行中對局裡的玩家請出去，騰出位子
    const match = decodeMatch(record);
    for (const [id, p] of Object.entries(players)) {
      if (!p.online && !(isActiveMatch(match) && match.playerIds.includes(id))) {
        delete players[id];
        delete scores[id];
      }
    }
    if (Object.keys(players).length >= MAX_PLAYERS) {
      throw new RoomError(`房間已滿（最多 ${MAX_PLAYERS} 人）`);
    }
  }

  players[playerId] = { name, joinedAt: now, online: true };
  scores[playerId] ??= 0;
  return { ...record, players, scores };
}

/** 回傳 null 代表最後一個人也離開了，房間直接刪除。 */
export function leave(record: RoomRecord, playerId: string): RoomRecord | null {
  const players = { ...record.players };
  const scores = { ...record.scores };
  delete players[playerId];
  delete scores[playerId];
  if (Object.keys(players).length === 0) return null;
  return { ...record, players, scores };
}

export function startMatch(
  record: RoomRecord,
  requesterId: string,
  gameId: string,
  random: () => number,
  now: number,
): RoomRecord {
  if (hostOf(record) !== requesterId) throw new RoomError('只有房主可以開始遊戲');
  if (isActiveMatch(decodeMatch(record))) throw new RoomError('目前還有一局正在進行');
  const game = getGame(gameId);
  if (!game) throw new RoomError('找不到這個遊戲');

  const playerIds = sortedPlayers(record)
    .filter((p) => p.online)
    .map((p) => p.id);
  if (playerIds.length < game.minPlayers || playerIds.length > game.maxPlayers) {
    throw new RoomError(`${game.name} 需要 ${playerCountLabel(game)}`);
  }

  const match: MatchData = {
    id: Math.floor(random() * 1e9).toString(36),
    gameId,
    playerIds,
    state: game.setup(playerIds, random),
    result: null,
    startedAt: now,
  };
  return { ...record, match: JSON.stringify(match) };
}

export function applyMove(record: RoomRecord, playerId: string, move: unknown, now: number): RoomRecord {
  const match = decodeMatch(record);
  if (!isActiveMatch(match)) throw new RoomError('這局已經結束了');
  if (!match.playerIds.includes(playerId)) throw new RoomError('你沒有參加這一局');
  const game = getGame(match.gameId);
  if (!game) throw new RoomError('找不到這個遊戲');

  const state = game.applyMove(match.state, playerId, move);
  const names = Object.fromEntries(sortedPlayers(record).map((p) => [p.id, p.name]));
  const result = game.getResult(state, names);
  const next: RoomRecord = { ...record, match: JSON.stringify({ ...match, state, result }) };

  if (result) {
    const scores = { ...record.scores };
    for (const [id, pts] of Object.entries(result.points)) {
      if (id in scores) scores[id] += pts;
    }
    const history = [{ gameId: match.gameId, message: result.message, at: now }, ...decodeHistory(record)];
    next.scores = scores;
    next.history = JSON.stringify(history.slice(0, HISTORY_LIMIT));
  }
  return next;
}

/** 房主結束目前的對局（不論是否打完）並回到大廳。 */
export function backToLobby(record: RoomRecord, requesterId: string): RoomRecord {
  if (hostOf(record) !== requesterId) throw new RoomError('只有房主可以回到大廳');
  const next = { ...record };
  delete next.match;
  return next;
}

export function playerCountLabel(game: { minPlayers: number; maxPlayers: number }): string {
  return game.minPlayers === game.maxPlayers
    ? `${game.minPlayers} 人`
    : `${game.minPlayers}–${game.maxPlayers} 人`;
}

export function errorMessage(err: unknown): string {
  if (err instanceof RoomError || err instanceof GameError) return err.message;
  console.error(err);
  return '發生未預期的錯誤，請再試一次';
}
