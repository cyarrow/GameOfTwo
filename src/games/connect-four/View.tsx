import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { COLS, DISCS, type ConnectFourMove, type ConnectFourState } from './logic';

export function ConnectFourView({ state, me, names, sendMove, finished }: GameViewProps<ConnectFourState, ConnectFourMove>) {
  const { send, error, busy } = useMove(sendMove);
  const myTurn = !finished && state.players[state.turn] === me;

  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      <div className="turn-order">
        {state.players.map((id, i) => (
          <span key={id} className={`chip ${!finished && state.turn === i ? 'active' : ''}`}>
            {DISCS[i]} {nameOf(names, id)}
            {id === me ? '（你）' : ''}
          </span>
        ))}
      </div>
      {!finished && <p className="turn-hint">{myTurn ? '輪到你了！點一行放棋子' : `輪到 ${nameOf(names, state.players[state.turn])}`}</p>}
      <div className="c4-board" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {state.board.map((cell, i) => {
          const col = i % COLS;
          return (
            <button
              key={i}
              className={`c4-cell ${state.winLine?.includes(i) ? 'win' : ''} ${state.lastMove === i ? 'last' : ''}`}
              disabled={!myTurn || busy || state.board[col] !== null}
              onClick={() => send({ col })}
              aria-label={`第 ${col + 1} 行`}
            >
              {cell === null ? '' : DISCS[cell]}
            </button>
          );
        })}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
