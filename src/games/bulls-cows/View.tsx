import { useState, type FormEvent } from 'react';
import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { DIGITS, isValidGuess, type BullsCowsMove, type BullsCowsState } from './logic';

export function BullsCowsView({ state, me, names, sendMove, finished }: GameViewProps<BullsCowsState, BullsCowsMove>) {
  const { send, error, busy } = useMove(sendMove);
  const [input, setInput] = useState('');
  const turnId = state.order[state.turn];
  const myTurn = !finished && me === turnId;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = await send({ guess: input });
    if (!err) setInput('');
  }

  return (
    <div className="stack">
      <div className="range-display">
        {finished ? <strong className="bomb">{state.secret}</strong> : <strong>{'？'.repeat(DIGITS)}</strong>}
      </div>
      {!finished && <p className="turn-hint">{myTurn ? '輪到你猜！' : `輪到 ${nameOf(names, turnId)}`}</p>}
      {myTurn && (
        <form className="row" style={{ maxWidth: 320, width: '100%', alignSelf: 'center' }} onSubmit={submit}>
          <input
            inputMode="numeric"
            maxLength={DIGITS}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
            placeholder={`${DIGITS} 個不重複的數字`}
            className="code-input"
            autoFocus
            aria-label="你猜的數字"
          />
          <button type="submit" className="primary" disabled={busy || !isValidGuess(input)}>
            猜！
          </button>
        </form>
      )}
      {error && <p className="error center">{error}</p>}
      <p className="center muted">A = 數字和位置都對，B = 數字對但位置錯。大家的線索都看得到！</p>

      <div className="turn-order">
        {state.order.map((id) => (
          <span key={id} className={`chip ${id === turnId && !finished ? 'active' : ''}`}>
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}
          </span>
        ))}
      </div>

      {state.guesses.length > 0 && (
        <ol className="guess-log" reversed>
          {[...state.guesses].reverse().map((g, i) => (
            <li key={state.guesses.length - i}>
              <span>{nameOf(names, g.by)}</span>
              <strong className="mono">{g.guess}</strong>
              <span className={g.a === DIGITS ? 'success' : ''}>
                <strong>{g.a}A{g.b}B</strong>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
