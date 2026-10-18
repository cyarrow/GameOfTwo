import { initializeApp } from 'firebase/app';
import {
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
} from 'firebase/database';
import type { Backend } from './types';

export function createFirebaseBackend(databaseURL: string): Backend {
  const db = getDatabase(initializeApp({ databaseURL }));

  return {
    kind: 'firebase',
    async get<T>(path: string) {
      const snap = await get(ref(db, path));
      return snap.exists() ? (snap.val() as T) : null;
    },
    set: (path, value) => set(ref(db, path), value),
    remove: (path) => remove(ref(db, path)),
    async transaction<T>(path: string, fn: (current: T | null) => T | null | undefined) {
      const result = await runTransaction(ref(db, path), (current: T | null) => {
        const next = fn(current);
        // Firebase 第一次呼叫時可能還沒拿到資料而傳入 null。此時回傳 null 而不是放棄，
        // 若伺服器上其實有資料，Firebase 會自動用真正的值再呼叫一次。
        if (next === undefined && current === null) return null;
        return next;
      });
      return {
        committed: result.committed,
        value: result.snapshot.exists() ? (result.snapshot.val() as T) : null,
      };
    },
    subscribe<T>(path: string, cb: (value: T | null) => void) {
      return onValue(ref(db, path), (snap) => cb(snap.exists() ? (snap.val() as T) : null));
    },
    onDisconnectSet: (path, value) => onDisconnect(ref(db, path)).set(value),
    cancelOnDisconnect: (path) => onDisconnect(ref(db, path)).cancel(),
    onConnectionChange(cb) {
      return onValue(ref(db, '.info/connected'), (snap) => cb(snap.val() === true));
    },
  };
}
