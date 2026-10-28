import { Check, Link2, LogOut } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Avatar } from '../components/Avatar';
import { EmojiBurst } from '../components/EmojiBurst';
import { GameStage } from '../components/GameStage';
import { Lobby } from '../components/Lobby';
import { Sidebar } from '../components/Sidebar';
import { getPlayerId, getSavedName, NAME_MAX_LENGTH, saveName } from '../platform/identity';
import { leaveRoom } from '../platform/room';
import { useRoom } from '../platform/useRoom';

export function RoomPage({ code }: { code: string }) {
  const [name, setName] = useState(getSavedName);
  if (!name.trim()) return <NameGate code={code} onDone={setName} />;
  return <RoomSession code={code} name={name.trim()} />;
}

/** 透過邀請連結直接進來、還沒設定暱稱的人，先輸入暱稱。 */
function NameGate({ code, onDone }: { code: string; onDone: (name: string) => void }) {
  const [value, setValue] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    saveName(trimmed);
    onDone(trimmed);
  }

  return (
    <form className="card stack narrow" onSubmit={submit}>
      <h2>加入房間 {code}</h2>
      <label className="field">
        <span>你的暱稱</span>
        <input value={value} maxLength={NAME_MAX_LENGTH} onChange={(e) => setValue(e.target.value)} autoFocus />
      </label>
      <button type="submit" className="primary" disabled={!value.trim()}>
        加入
      </button>
    </form>
  );
}

function RoomSession({ code, name }: { code: string; name: string }) {
  const playerId = getPlayerId();
  const status = useRoom(code, playerId, name);
  const [copied, setCopied] = useState(false);

  if (status.kind === 'loading') return <p className="center muted loading">連線中…</p>;
  if (status.kind === 'error') {
    return (
      <div className="card stack narrow">
        <p className="error">{status.message}</p>
        <a className="button" href="#/">
          回首頁
        </a>
      </div>
    );
  }

  const { room } = status;
  const onlineCount = room.players.filter((p) => p.online).length;

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#/room/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('複製這個連結傳給朋友：', url);
    }
  }

  async function leave() {
    await leaveRoom(code, playerId);
    window.location.hash = '#/';
  }

  return (
    <div className="room">
      <div className="room-header">
        <h1 className="room-code-pill">
          <span className="muted">房號</span>
          <span className="room-code">{code}</span>
        </h1>
        <div className="avatar-stack" role="group" aria-label="房間成員">
          {room.players.map((p) => (
            <Avatar key={p.id} id={p.id} name={p.name} size={34} dim={!p.online} />
          ))}
        </div>
        <div className="row room-actions">
          {/* 只有自己一個人時，邀請朋友才是主要動作 */}
          <button className={onlineCount < 2 ? 'primary' : ''} onClick={copyLink}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
            {copied ? '已複製連結' : '邀請朋友'}
          </button>
          <button className="ghost" onClick={leave}>
            <LogOut size={16} aria-hidden="true" />
            離開
          </button>
        </div>
      </div>

      <div className="room-body">
        <div className="room-main">
          {room.match ? <GameStage room={room} match={room.match} me={playerId} /> : <Lobby room={room} me={playerId} />}
        </div>
        <Sidebar room={room} me={playerId} />
      </div>
      <EmojiBurst chat={room.chat} />
    </div>
  );
}
