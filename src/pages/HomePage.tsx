import { useState, type FormEvent } from 'react';
import { GAMES } from '../games/registry';
import { getPlayerId, getSavedName, NAME_MAX_LENGTH, saveName } from '../platform/identity';
import { createRoom, isValidCode, normalizeCode } from '../platform/room';
import { errorMessage, playerCountLabel } from '../platform/roomState';
import { MAX_PLAYERS } from '../platform/types';

export function HomePage() {
  const [name, setName] = useState(getSavedName);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();

  async function onCreate() {
    if (!trimmed) return setError('請先輸入暱稱');
    setBusy(true);
    setError(null);
    try {
      saveName(trimmed);
      const newCode = await createRoom(getPlayerId(), trimmed);
      window.location.hash = `#/room/${newCode}`;
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return setError('請先輸入暱稱');
    const normalized = normalizeCode(code);
    if (!isValidCode(normalized)) return setError('房號是 4 個英文或數字');
    saveName(trimmed);
    window.location.hash = `#/room/${normalized}`;
  }

  return (
    <div className="home">
      <section className="hero">
        <h1>跟朋友一起玩小遊戲</h1>
        <p className="muted">建立房間、把房號傳給朋友，2～{MAX_PLAYERS} 人就能開玩。不用註冊。</p>
      </section>

      <section className="card stack">
        <label className="field">
          <span>你的暱稱</span>
          <input
            value={name}
            maxLength={NAME_MAX_LENGTH}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：小明"
            autoFocus={!name}
          />
        </label>

        <button className="primary big" onClick={onCreate} disabled={busy}>
          {busy ? '建立中…' : '建立房間'}
        </button>

        <div className="divider">或加入朋友的房間</div>

        <form className="row" onSubmit={onJoin}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="房號"
            maxLength={4}
            className="code-input"
            aria-label="房號"
          />
          <button type="submit">加入</button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <h2>目前有的遊戲</h2>
        <div className="game-grid">
          {GAMES.map((g) => (
            <div key={g.id} className="game-card">
              <div className="game-emoji">{g.emoji}</div>
              <div>
                <h3>{g.name}</h3>
                <span className="badge">{playerCountLabel(g)}</span>
                <p className="muted">{g.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
