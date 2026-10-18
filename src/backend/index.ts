import type { Backend } from './types';

const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined;

/** 有設定 Firebase 網址就連線 Firebase，否則使用本機示範模式。 */
export const backendKind: Backend['kind'] = databaseURL ? 'firebase' : 'local';

let backendPromise: Promise<Backend> | null = null;

export function getBackend(): Promise<Backend> {
  backendPromise ??= databaseURL
    ? import('./firebase').then((m) => m.createFirebaseBackend(databaseURL))
    : import('./local').then((m) => m.createLocalBackend());
  return backendPromise;
}

export type { Backend } from './types';
