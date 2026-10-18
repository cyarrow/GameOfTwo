import type { Room } from '../platform/types';
import { MAX_PLAYERS } from '../platform/types';

export function Sidebar({ room, me }: { room: Room; me: string }) {
  const ranked = [...room.players].sort((a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0));

  return (
    <aside className="sidebar stack">
      <section className="card">
        <h3>
          玩家 {room.players.length}/{MAX_PLAYERS}
        </h3>
        <ul className="player-list">
          {ranked.map((p) => (
            <li key={p.id} className={p.online ? '' : 'offline'}>
              <span className="player-name">
                {p.id === room.hostId && <span title="房主">👑 </span>}
                {p.name}
                {p.id === me && <span className="muted">（你）</span>}
                {!p.online && <span className="muted"> 離線</span>}
              </span>
              <span className="score">{room.scores[p.id] ?? 0} 分</span>
            </li>
          ))}
        </ul>
      </section>

      {room.history.length > 0 && (
        <section className="card">
          <h3>對戰紀錄</h3>
          <ul className="history">
            {room.history.map((h) => (
              <li key={h.at}>{h.message}</li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
