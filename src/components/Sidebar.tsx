import { removeOfflinePlayer } from '../platform/room';
import type { Room } from '../platform/types';
import { MAX_PLAYERS } from '../platform/types';
import { Avatar } from './Avatar';
import { ChatBox } from './ChatBox';

export function Sidebar({ room, me }: { room: Room; me: string }) {
  const ranked = [...room.players].sort((a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0));
  const isHost = room.hostId === me;

  return (
    <aside className="sidebar stack">
      <section className="card">
        <h3 className="panel-title">
          玩家 <span className="muted">{room.players.length}/{MAX_PLAYERS}</span>
        </h3>
        <ul className="player-list">
          {ranked.map((p) => (
            <li key={p.id} className={p.online ? '' : 'offline'}>
              <span className="player-name">
                <Avatar id={p.id} name={p.name} size={30} dim={!p.online} />
                <span>
                  {p.name}
                  {p.id === room.hostId && <span title="房主"> 👑</span>}
                  {p.id === me && <span className="muted">（你）</span>}
                  {!p.online && <small className="muted"> 離線</small>}
                </span>
              </span>
              <span className="row">
                {isHost && !p.online && (
                  <button
                    className="ghost small"
                    onClick={() => window.confirm(`把 ${p.name} 移出房間？`) && void removeOfflinePlayer(room.code, me, p.id).catch(() => {})}
                  >
                    移除
                  </button>
                )}
                <span className="score">{room.scores[p.id] ?? 0} 分</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <ChatBox room={room} me={me} />

      {room.history.length > 0 && (
        <section className="card">
          <h3 className="panel-title">對戰紀錄</h3>
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
