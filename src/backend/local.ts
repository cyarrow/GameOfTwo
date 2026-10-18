import type { Backend } from './types';

/**
 * 本機示範模式：用 localStorage 模擬資料庫，同一個瀏覽器的不同分頁之間會即時同步。
 * 還沒設定 Firebase 時可以先用它試玩與開發。
 */
const STORAGE_KEY = 'gameoftwo-local-db';

type Tree = Record<string, unknown>;

function load(): Tree {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Tree) ?? {};
  } catch {
    return {};
  }
}

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function getAt(tree: Tree, path: string): unknown {
  let node: unknown = tree;
  for (const key of splitPath(path)) {
    if (node === null || typeof node !== 'object') return null;
    node = (node as Tree)[key];
  }
  return node ?? null;
}

/** 與 Firebase 一致：null 與空物件都視為「不存在」。 */
function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  const out: Tree = {};
  for (const [k, v] of Object.entries(value as Tree)) {
    const n = normalize(v);
    if (n !== null) out[k] = n;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function setAt(tree: Tree, path: string, value: unknown): Tree {
  const keys = splitPath(path);
  if (keys.length === 0) return (normalize(value) as Tree) ?? {};
  const root: Tree = structuredClone(tree);
  let node = root;
  for (const key of keys.slice(0, -1)) {
    const child = node[key];
    if (child === null || typeof child !== 'object') node[key] = {};
    node = node[key] as Tree;
  }
  node[keys[keys.length - 1]] = value;
  return (normalize(root) as Tree) ?? {};
}

export function createLocalBackend(): Backend {
  const listeners = new Set<{ path: string; cb: (v: unknown) => void; last: string }>();
  const disconnectWrites = new Map<string, unknown>();

  function notify() {
    const tree = load();
    for (const l of listeners) {
      const value = getAt(tree, l.path);
      const json = JSON.stringify(value);
      if (json !== l.last) {
        l.last = json;
        l.cb(structuredClone(value));
      }
    }
  }

  function write(path: string, value: unknown) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setAt(load(), path, value)));
    // 其他分頁會收到 storage 事件；自己這個分頁要手動通知
    queueMicrotask(notify);
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) notify();
  });
  window.addEventListener('pagehide', () => {
    for (const [path, value] of disconnectWrites) write(path, value);
  });

  return {
    kind: 'local',
    async get<T>(path: string) {
      return structuredClone(getAt(load(), path)) as T | null;
    },
    async set(path, value) {
      write(path, value);
    },
    async remove(path) {
      write(path, null);
    },
    async transaction<T>(path: string, fn: (current: T | null) => T | null | undefined) {
      const current = structuredClone(getAt(load(), path)) as T | null;
      const next = fn(current);
      if (next === undefined) return { committed: false, value: current };
      write(path, next);
      return { committed: true, value: structuredClone(getAt(load(), path)) as T | null };
    },
    subscribe<T>(path: string, cb: (value: T | null) => void) {
      const value = getAt(load(), path);
      const listener = { path, cb: cb as (v: unknown) => void, last: JSON.stringify(value) };
      listeners.add(listener);
      queueMicrotask(() => cb(structuredClone(value) as T | null));
      return () => listeners.delete(listener);
    },
    async onDisconnectSet(path, value) {
      disconnectWrites.set(path, value);
    },
    async cancelOnDisconnect(path) {
      disconnectWrites.delete(path);
    },
    onConnectionChange(cb) {
      queueMicrotask(() => cb(true));
      return () => {};
    },
  };
}
