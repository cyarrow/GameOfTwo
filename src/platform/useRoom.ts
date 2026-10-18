import { useEffect, useState } from 'react';
import { getBackend } from '../backend';
import { joinRoom, markOffline, roomPath } from './room';
import { errorMessage, toRoom } from './roomState';
import type { Room, RoomRecord } from './types';

export type RoomStatus =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; room: Room };

/** 加入房間、維持在線狀態，並即時訂閱房間資料。 */
export function useRoom(code: string, playerId: string, name: string): RoomStatus {
  const [status, setStatus] = useState<RoomStatus>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let joined = false;
    const cleanups: (() => void)[] = [];

    getBackend().then((backend) => {
      if (cancelled) return;

      // 每次（重新）連上線都重新加入，確保自己被標記為在線上
      cleanups.push(
        backend.onConnectionChange((connected) => {
          if (!connected) return;
          joinRoom(code, playerId, name)
            .then(() => {
              joined = true;
            })
            .catch((e) => {
              if (!cancelled) setStatus({ kind: 'error', message: errorMessage(e) });
            });
        }),
      );

      cleanups.push(
        backend.subscribe<RoomRecord>(roomPath(code), (record) => {
          if (cancelled) return;
          if (record) {
            setStatus((prev) => (prev.kind === 'error' ? prev : { kind: 'ready', room: toRoom(code, record) }));
          } else if (joined) {
            setStatus({ kind: 'error', message: '房間已經不存在了' });
          }
        }),
      );
    });

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      if (joined) void markOffline(code, playerId);
    };
  }, [code, playerId, name]);

  return status;
}
