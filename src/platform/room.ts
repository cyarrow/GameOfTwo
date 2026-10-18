import { getBackend } from '../backend';
import * as rs from './roomState';
import type { RoomRecord } from './types';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易看錯的 0/O、1/I
const CODE_LENGTH = 4;

export const roomPath = (code: string) => `rooms/${code}`;
const onlinePath = (code: string, playerId: string) => `rooms/${code}/players/${playerId}/online`;

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidCode(code: string): boolean {
  return code.length === CODE_LENGTH && [...code].every((c) => CODE_ALPHABET.includes(c));
}

function randomCode(): string {
  return Array.from({ length: CODE_LENGTH }, () =>
    CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join('');
}

/** 在交易中對房間套用一個純函式；房間不存在或 fn 丟出錯誤時會把錯誤往外丟。 */
async function mutate(code: string, fn: (record: RoomRecord) => RoomRecord | null): Promise<void> {
  const backend = await getBackend();
  let error: unknown = null;
  await backend.transaction<RoomRecord>(roomPath(code), (current) => {
    error = null;
    if (!current) {
      error = new rs.RoomError('找不到這個房間，請確認房號');
      return undefined;
    }
    try {
      return fn(current);
    } catch (e) {
      error = e;
      return undefined;
    }
  });
  if (error) throw error;
}

export async function createRoom(playerId: string, name: string): Promise<string> {
  const backend = await getBackend();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    let taken = false;
    const res = await backend.transaction<RoomRecord>(roomPath(code), (current) => {
      taken = current !== null;
      return taken ? undefined : rs.newRoom(playerId, name, Date.now());
    });
    if (res.committed && !taken) return code;
  }
  throw new rs.RoomError('建立房間失敗，請再試一次');
}

/** 加入（或重新連上）房間，並登記斷線時自動標記為離線。 */
export async function joinRoom(code: string, playerId: string, name: string): Promise<void> {
  await mutate(code, (r) => rs.join(r, playerId, name, Date.now()));
  const backend = await getBackend();
  await backend.onDisconnectSet(onlinePath(code, playerId), false);
}

export async function markOffline(code: string, playerId: string): Promise<void> {
  const backend = await getBackend();
  await backend.cancelOnDisconnect(onlinePath(code, playerId));
  await mutate(code, (r) => {
    const p = r.players?.[playerId];
    if (!p?.name) return r;
    return { ...r, players: { ...r.players, [playerId]: { ...p, online: false } } };
  }).catch(() => {});
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const backend = await getBackend();
  await backend.cancelOnDisconnect(onlinePath(code, playerId));
  await mutate(code, (r) => rs.leave(r, playerId)).catch(() => {});
}

export function startMatch(code: string, playerId: string, gameId: string): Promise<void> {
  return mutate(code, (r) => rs.startMatch(r, playerId, gameId, Math.random, Date.now()));
}

/** 送出遊戲動作；成功回傳 null，失敗回傳錯誤訊息。 */
export async function sendMove(code: string, playerId: string, move: unknown): Promise<string | null> {
  try {
    await mutate(code, (r) => rs.applyMove(r, playerId, move, Date.now()));
    return null;
  } catch (e) {
    return rs.errorMessage(e);
  }
}

export function backToLobby(code: string, playerId: string): Promise<void> {
  return mutate(code, (r) => rs.backToLobby(r, playerId));
}
