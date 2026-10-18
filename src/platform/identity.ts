/**
 * 玩家身分不需要註冊：每個分頁各自產生一組隨機 id（存在 sessionStorage，
 * 重新整理後不變），名字則存在 localStorage 方便下次自動帶入。
 * 用分頁區分身分，也讓你可以開兩個分頁自己測試多人遊戲。
 */
const ID_KEY = 'gameoftwo-player-id';
const NAME_KEY = 'gameoftwo-player-name';

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // 無痕模式等情況可能無法寫入，忽略即可
  }
}

let cachedId: string | null = null;

export function getPlayerId(): string {
  cachedId ??= safeGet(sessionStorage, ID_KEY);
  if (!cachedId) {
    cachedId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    safeSet(sessionStorage, ID_KEY, cachedId);
  }
  return cachedId;
}

export function getSavedName(): string {
  return safeGet(localStorage, NAME_KEY) ?? '';
}

export function saveName(name: string) {
  safeSet(localStorage, NAME_KEY, name);
}

export const NAME_MAX_LENGTH = 12;
