import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../platform/types';
import { QUICK_EMOJIS } from './ChatBox';

interface Float {
  id: string;
  emoji: string;
  left: number;
}

/** 有人送出快速表情時，在畫面上飄出大大的表情 */
export function EmojiBurst({ chat }: { chat: ChatMessage[] }) {
  const seen = useRef<Set<string> | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  useEffect(() => {
    // 第一次載入時的舊訊息不要飄
    if (seen.current === null) {
      seen.current = new Set(chat.map((m) => m.id));
      return;
    }
    const fresh = chat.filter((m) => !seen.current!.has(m.id));
    fresh.forEach((m) => seen.current!.add(m.id));
    const added = fresh
      .filter((m) => QUICK_EMOJIS.includes(m.text))
      .map((m) => ({ id: m.id, emoji: m.text, left: 10 + Math.random() * 80 }));
    if (added.length === 0) return;
    setFloats((f) => [...f, ...added]);
    // 計時器不能在 effect 清除時取消，否則下一則訊息進來時，前一個表情會永遠留在畫面上
    timers.current.push(window.setTimeout(() => setFloats((f) => f.filter((x) => !added.includes(x))), 2500));
  }, [chat]);

  return (
    <div className="emoji-burst" aria-hidden="true">
      {floats.map((f) => (
        <span key={f.id} style={{ left: `${f.left}%` }}>
          {f.emoji}
        </span>
      ))}
    </div>
  );
}
