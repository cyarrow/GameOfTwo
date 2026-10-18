import { useState } from 'react';
import { GAMES } from '../games/registry';
import { setPunish, startMatch } from '../platform/room';
import { errorMessage, playerCountLabel } from '../platform/roomState';
import type { Room } from '../platform/types';

export function Lobby({ room, me }: { room: Room; me: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isHost = room.hostId === me;
  const onlineCount = room.players.filter((p) => p.online).length;
  const host = room.players.find((p) => p.id === room.hostId);
  const playable = GAMES.filter((g) => onlineCount >= g.minPlayers && onlineCount <= g.maxPlayers);

  async function start(gameId: string) {
    setBusy(true);
    setError(null);
    try {
      await startMatch(room.code, me, gameId);
    } catch (e) {
      setError(errorMessage(e));
    }
    setBusy(false);
  }

  function startRandom() {
    const game = playable[Math.floor(Math.random() * playable.length)];
    if (game) void start(game.id);
  }

  return (
    <div className="stack">
      <div className="lobby-status">
        {onlineCount < 2 ? (
          <p>👋 把房號或邀請連結傳給朋友，等大家加入吧！</p>
        ) : isHost ? (
          <p>你是房主，選一個遊戲開始吧！（目前 {onlineCount} 人）</p>
        ) : (
          <p>等待房主 {host?.name ?? ''} 選擇遊戲…</p>
        )}
        {isHost && playable.length > 0 && (
          <button onClick={startRandom} disabled={busy}>
            🎲 隨機選一個
          </button>
        )}
      </div>
      <label className={`punish-toggle ${room.punish ? 'on' : ''}`}>
        <input
          type="checkbox"
          checked={room.punish}
          disabled={!isHost}
          onChange={(e) => void setPunish(room.code, me, e.target.checked).catch((err) => setError(errorMessage(err)))}
        />
        <span>
          😈 懲罰模式{room.punish ? '：開啟' : '：關閉'}
          <small className="muted">每局結束時抽一張懲罰卡給輸的人{isHost ? '' : '（由房主切換）'}</small>
        </span>
      </label>
      {error && <p className="error">{error}</p>}

      <div className="game-grid">
        {GAMES.map((g) => {
          const fits = onlineCount >= g.minPlayers && onlineCount <= g.maxPlayers;
          return (
            <div key={g.id} className={`game-card ${fits ? '' : 'disabled'}`}>
              <div className="game-emoji">{g.emoji}</div>
              <div className="stack-sm">
                <h3>{g.name}</h3>
                <span className="badge">{playerCountLabel(g)}</span>
                <p className="muted">{g.description}</p>
                {isHost && (
                  <button className="primary" disabled={!fits || busy} onClick={() => start(g.id)}>
                    {fits ? '開始' : `需要 ${playerCountLabel(g)}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
