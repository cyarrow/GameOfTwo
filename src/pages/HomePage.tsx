import { ArrowRight, PencilLine } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { GameTile } from '../components/GameTile';
import { GAMES } from '../games/registry';
import { getPlayerId, getSavedName, NAME_MAX_LENGTH, saveName } from '../platform/identity';
import { createRoom, isValidCode, normalizeCode } from '../platform/room';
import { errorMessage } from '../platform/roomState';
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
        <span className="eyebrow">
          {GAMES.length} 款小遊戲 · 2～{MAX_PLAYERS} 人 · 免註冊
        </span>
        <h1 className="display">
          跟朋友一起
          <br />
          <span className="grad-text">玩點小遊戲</span>
        </h1>
        <p className="muted lead">建立房間、把房號傳給朋友，打開網頁就能一起玩。</p>
      </section>

      <section className="card start-card">
        <label className="field">
          <span>你的暱稱</span>
          <input
            className="big-input"
            value={name}
            maxLength={NAME_MAX_LENGTH}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：小明"
            autoFocus={!name}
          />
        </label>
        <div className="start-actions">
          <button className="primary big" onClick={onCreate} disabled={busy}>
            {busy ? '建立中…' : '建立房間'}
          </button>
          <span className="or">或</span>
          <form className="join-form" onSubmit={onJoin}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="房號"
              maxLength={4}
              className="code-input big-input"
              aria-label="房號"
            />
            <button type="submit" className="big">
              加入
            </button>
          </form>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="stack">
        <div className="section-head">
          <h2>全部遊戲</h2>
          <a href="#/banks" className="muted">
            <PencilLine size={16} aria-hidden="true" />
            自訂題庫
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="game-grid">
          {GAMES.map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
      </section>
    </div>
  );
}
