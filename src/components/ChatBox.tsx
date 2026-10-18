import { useEffect, useRef, useState, type FormEvent } from 'react';
import { sendChat } from '../platform/room';
import { CHAT_MAX_LENGTH, errorMessage } from '../platform/roomState';
import type { Room } from '../platform/types';

export const QUICK_EMOJIS = ['👍', '😂', '😱', '🔥', '🎉', '😭'];

export function ChatBox({ room, me }: { room: Room; me: string }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const names = Object.fromEntries(room.players.map((p) => [p.id, p.name]));

  // 有新訊息時捲到最下面
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [room.chat.length]);

  async function send(message: string) {
    setError(null);
    try {
      await sendChat(room.code, me, message);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    void send(text);
    setText('');
  }

  return (
    <section className="card chat">
      <h3>聊天</h3>
      <ul className="chat-list" ref={listRef}>
        {room.chat.length === 0 && <li className="muted">還沒有訊息，打聲招呼吧！</li>}
        {room.chat.map((m) => (
          <li key={m.id} className={m.by === me ? 'mine' : ''}>
            <span className="chat-name">{names[m.by] ?? '（已離開）'}</span>
            <span className={QUICK_EMOJIS.includes(m.text) ? 'chat-emoji' : ''}>{m.text}</span>
          </li>
        ))}
      </ul>
      <div className="emoji-row">
        {QUICK_EMOJIS.map((emoji) => (
          <button key={emoji} className="ghost small" onClick={() => send(emoji)} aria-label={`送出 ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
      <form className="row" onSubmit={submit}>
        <input
          value={text}
          maxLength={CHAT_MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          placeholder="說點什麼…"
          aria-label="聊天訊息"
        />
        <button type="submit" disabled={!text.trim()}>
          送出
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
