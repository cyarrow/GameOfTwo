import type { GameViewProps } from '../types';
import { nameOf, PLAYER_COLORS, useMove } from '../helpers';
import { currentPlayer, type MemoryMove, type MemoryState } from './logic';

export function MemoryView({ state, me, names, sendMove, finished }: GameViewProps<MemoryState, MemoryMove>) {
  const { send, error, busy } = useMove(sendMove);
  const turnId = currentPlayer(state);
  const myTurn = !finished && me === turnId;
  const colorOf = (id: string) => PLAYER_COLORS[state.order.indexOf(id) % PLAYER_COLORS.length];
  const mismatch = state.flipped.length === 2;

  return (
    <div className="stack">
      <div className="turn-order">
        {state.order.map((id) => (
          <span key={id} className={`chip ${id === turnId && !finished ? 'active' : ''}`}>
            <span className="color-dot" style={{ background: colorOf(id) }} />
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}：{state.pairs[id]} 對
          </span>
        ))}
      </div>
      {!finished && (
        <p className="turn-hint">
          {myTurn ? '輪到你翻牌！' : `輪到 ${nameOf(names, turnId)}`}
          {mismatch && <span className="muted">（上一位沒配對成功）</span>}
        </p>
      )}

      <div className="memory-grid">
        {state.cards.map((symbol, i) => {
          const owner = state.matchedBy[i];
          const faceUp = owner !== null || state.flipped.includes(i) || finished;
          return (
            <button
              key={`${i}-${faceUp}`}
              className={`memory-card flip-in ${faceUp ? 'up' : ''} ${mismatch && state.flipped.includes(i) ? 'miss' : ''}`}
              style={owner ? { borderColor: colorOf(owner) } : undefined}
              disabled={!myTurn || busy || owner !== null || (!mismatch && state.flipped.includes(i))}
              onClick={() => send({ card: i })}
              aria-label={faceUp ? symbol : `第 ${i + 1} 張牌`}
            >
              {faceUp ? symbol : '?'}
            </button>
          );
        })}
      </div>
      {error && <p className="error center">{error}</p>}
    </div>
  );
}
