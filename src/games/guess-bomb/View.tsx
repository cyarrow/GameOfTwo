import { useState, type FormEvent } from 'react';
import type { GameViewProps } from '../types';
import { currentPlayer, type GuessBombMove, type GuessBombState } from './logic';

export function GuessBombView({ state, me, names, sendMove, finished }: GameViewProps<GuessBombState, GuessBombMove>) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const turnId = currentPlayer(state);
  const myTurn = !finished && me === turnId;
  const lo = state.low + 1;
  const hi = state.high - 1;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await sendMove({ value: Number(input) });
    setBusy(false);
    setError(err);
    if (!err) setInput('');
  }

  return (
    <div className="guess-bomb">
      <div className="range-display" aria-live="polite">
        {finished ? (
          <>
            <span className="muted">密碼是</span>
            <strong className="bomb">💥 {state.bomb}</strong>
          </>
        ) : (
          <>
            <strong>{lo}</strong>
            <span className="muted">～</span>
            <strong>{hi}</strong>
          </>
        )}
      </div>

      {!finished && (
        <p className="turn-hint">
          {myTurn ? '輪到你了！' : `輪到 ${names[turnId] ?? '…'}`}
          {lo === hi && '（只剩炸彈了 😱）'}
        </p>
      )}

      {myTurn && (
        <form className="row" onSubmit={submit}>
          <input
            type="number"
            inputMode="numeric"
            min={lo}
            max={hi}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${lo} ~ ${hi}`}
            autoFocus
            aria-label="你猜的數字"
          />
          <button type="submit" className="primary" disabled={busy || input === ''}>
            猜！
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}

      <div className="turn-order">
        {state.order.map((id) => (
          <span key={id} className={`chip ${id === turnId && !finished ? 'active' : ''} ${id === state.loser ? 'loser' : ''}`}>
            {id === state.loser ? '💣 ' : ''}
            {names[id] ?? '（已離開）'}
            {id === me ? '（你）' : ''}
          </span>
        ))}
      </div>

      {state.guesses.length > 0 && (
        <ol className="guess-log" reversed>
          {[...state.guesses].reverse().map((g, i) => (
            <li key={state.guesses.length - i}>
              <span>{names[g.by] ?? '（已離開）'}</span>
              <span className="muted">猜了</span>
              <strong>{g.value}</strong>
              <span className="muted">
                {g.value === state.bomb ? '💥 爆炸！' : g.value < state.bomb ? '太小' : '太大'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
