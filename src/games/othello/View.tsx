import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { counts, DISCS, legalMoves, SIZE, type OthelloMove, type OthelloState } from './logic';

export function OthelloView({ state, me, names, sendMove, finished }: GameViewProps<OthelloState, OthelloMove>) {
  const { send, error, busy } = useMove(sendMove);
  const myTurn = !finished && state.players[state.turn] === me;
  const legal = new Set(myTurn ? legalMoves(state.board, state.turn) : []);
  const score = counts(state.board);

  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      <div className="turn-order">
        {state.players.map((id, i) => (
          <span key={id} className={`chip ${!finished && state.turn === i ? 'active' : ''}`}>
            {DISCS[i]} {nameOf(names, id)}
            {id === me ? '（你）' : ''}：{score[i]}
          </span>
        ))}
      </div>
      {!finished && (
        <p className="turn-hint">
          {state.passed !== null && `${nameOf(names, state.players[state.passed])} 沒地方下，跳過！`}
          {myTurn ? '輪到你了！（小點是可以下的位置）' : `輪到 ${nameOf(names, state.players[state.turn])}`}
        </p>
      )}
      <div className="oth-board" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {state.board.map((cell, i) => (
          <button
            key={i}
            className={`oth-cell ${legal.has(i) ? 'legal' : ''} ${state.lastMove === i ? 'last' : ''}`}
            disabled={!legal.has(i) || busy}
            onClick={() => send({ cell: i })}
            aria-label={`第 ${Math.floor(i / SIZE) + 1} 列第 ${(i % SIZE) + 1} 行`}
          >
            {cell !== null && <span className={`oth-disc ${cell === 0 ? 'black' : 'white'}`} />}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
