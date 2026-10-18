import type { Backend } from './types';

/**
 * 本機示範模式：用 IndexedDB 模擬資料庫，同一個瀏覽器的不同分頁之間會即時同步。
 * 還沒設定 Firebase 時可以先用它試玩與開發。
 *
 * 用 IndexedDB 而不是 localStorage，是因為 localStorage 在分頁之間是非同步同步的，
 * 兩個分頁同時寫入時會互相蓋掉；IndexedDB 的讀寫交易在分頁之間是原子性的。
 */
const DB_NAME = 'gameoftwo-local';
const STORE = 'kv';
const TREE_KEY = 'tree';

type Tree = Record<string, unknown>;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function readTree(db: IDBDatabase): Promise<Tree> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(TREE_KEY);
    req.onsuccess = () => resolve((req.result as Tree | undefined) ?? {});
    req.onerror = () => reject(req.error);
  });
}

/** 在單一個 IndexedDB 交易裡讀取、修改、寫回。fn 回傳 undefined 代表不寫入。 */
function updateTree(db: IDBDatabase, fn: (tree: Tree) => Tree | undefined): Promise<{ tree: Tree; written: boolean }> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    let result = { tree: {} as Tree, written: false };
    const req = store.get(TREE_KEY);
    req.onsuccess = () => {
      const current = (req.result as Tree | undefined) ?? {};
      const next = fn(current);
      result = next === undefined ? { tree: current, written: false } : { tree: next, written: true };
      if (next !== undefined) store.put(next, TREE_KEY);
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
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

export async function createLocalBackend(): Promise<Backend> {
  const db = await openDb();
  const channel = new BroadcastChannel(DB_NAME);
  const listeners = new Set<{ path: string; cb: (v: unknown) => void; last: string }>();
  const disconnectWrites = new Map<string, unknown>();
  let readSeq = 0;
  let deliveredSeq = 0;

  async function notify() {
    const seq = ++readSeq;
    const tree = await readTree(db);
    // 讀取是非同步的，比較舊的結果晚到時直接丟掉
    if (seq < deliveredSeq) return;
    deliveredSeq = seq;
    for (const l of listeners) {
      const value = getAt(tree, l.path);
      const json = JSON.stringify(value);
      if (json !== l.last) {
        l.last = json;
        l.cb(structuredClone(value));
      }
    }
  }

  async function update(fn: (tree: Tree) => Tree | undefined) {
    const result = await updateTree(db, fn);
    if (result.written) {
      channel.postMessage('changed');
      void notify();
    }
    return result;
  }

  const write = (path: string, value: unknown) => update((tree) => setAt(tree, path, value)).then(() => {});

  channel.onmessage = () => void notify();
  window.addEventListener('pagehide', () => {
    for (const [path, value] of disconnectWrites) void write(path, value);
  });

  return {
    kind: 'local',
    async get<T>(path: string) {
      return getAt(await readTree(db), path) as T | null;
    },
    set: write,
    remove: (path) => write(path, null),
    async transaction<T>(path: string, fn: (current: T | null) => T | null | undefined) {
      const { tree, written } = await update((t) => {
        const next = fn(structuredClone(getAt(t, path)) as T | null);
        return next === undefined ? undefined : setAt(t, path, next);
      });
      return { committed: written, value: structuredClone(getAt(tree, path)) as T | null };
    },
    subscribe<T>(path: string, cb: (value: T | null) => void) {
      const listener = { path, cb: cb as (v: unknown) => void, last: '' };
      listeners.add(listener);
      void readTree(db).then((tree) => {
        if (!listeners.has(listener) || listener.last !== '') return;
        const value = getAt(tree, path);
        listener.last = JSON.stringify(value);
        cb(structuredClone(value) as T | null);
      });
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
