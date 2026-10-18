import { useState } from 'react';
import { GAMES } from '../games/registry';
import type { AnyGame, GameCategory } from '../games/types';
import { setPunish, startMatch } from '../platform/room';
import { errorMessage, playerCountLabel } from '../platform/roomState';
import type { Room } from '../platform/types';
import { GameTile } from './GameTile';

const CATEGORIES: ('全部' | GameCategory)[] = ['全部', '派對', '卡牌', '反應', '策略'];

export function Lobby({ room, me }: { room: Room; me: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('全部');
  const isHost = room.hostId === me;
  const onlineCount = room.players.filter((p) => p.online).length;
  const host = room.players.find((p) => p.id === room.hostId);
  const fitsCount = (g: AnyGame) => onlineCount >= g.minPlayers && onlineCount <= g.maxPlayers;
  const playable = GAMES.filter(fitsCount);
  const shown = GAMES.filter((g) => category === '全部' || g.category === category);
  // 遊戲很多，目前人數能玩的排前面
  const sorted = [...shown.filter(fitsCount), ...shown.filter((g) => !fitsCount(g))];

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
      <div className="lobby-hero">
        <div>
          <h2>
            {onlineCount < 2 ? '等朋友加入…' : isHost ? '選一個遊戲開始吧！' : `等待 ${host?.name ?? '房主'} 選遊戲…`}
          </h2>
          <p className="muted">
            {onlineCount < 2
              ? '把房號或邀請連結傳給朋友，2 人以上就能開始。'
              : `目前 ${onlineCount} 人在線上，有 ${playable.length} 款遊戲可以玩。`}
          </p>
        </div>
        {isHost && playable.length > 0 && (
          <button className="primary" onClick={startRandom} disabled={busy}>
            🎲 隨機選一個
          </button>
        )}
      </div>

      <div className="lobby-tools">
        <label className={`punish-toggle ${room.punish ? 'on' : ''}`}>
          <input
            type="checkbox"
            role="switch"
            checked={room.punish}
            disabled={!isHost}
            onChange={(e) => void setPunish(room.code, me, e.target.checked).catch((err) => setError(errorMessage(err)))}
          />
          <span className="switch" aria-hidden="true" />
          <span>
            😈 懲罰模式
            <small className="muted">輸的人抽懲罰卡{isHost ? '' : '（房主切換）'}</small>
          </span>
        </label>
        <a className="button ghost" href="#/banks" target="_blank" rel="noopener">
          ✏️ 自訂題庫
        </a>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="segmented" role="tablist" aria-label="遊戲分類">
        {CATEGORIES.map((c) => (
          <button key={c} role="tab" aria-selected={category === c} className={category === c ? 'on' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="game-grid">
        {sorted.map((g) => {
          const fits = fitsCount(g);
          return (
            <GameTile key={g.id} game={g} disabled={!fits}>
              {isHost && (
                <button className="primary" disabled={!fits || busy} onClick={() => start(g.id)}>
                  {fits ? '開始' : `需要 ${playerCountLabel(g)}`}
                </button>
              )}
            </GameTile>
          );
        })}
      </div>
    </div>
  );
}
