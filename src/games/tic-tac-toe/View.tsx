import { useState } from 'react';
import type { GameViewProps } from '../types';
import { MARKS, type TicTacToeMove, type TicTacToeState } from './logic';

export function TicTacToeView({ state, me, names, sendMove, finished }: GameViewProps<TicTacToeState, TicTacToeMove>) {
  const [error, setError] = useState<string | null>(null);
  const myTurn = !finished && state.players[state.turn] === me;

  async function play(cell: number) {
    setError(await sendMove({ cell }));
  }

  return (
    <div className="tic-tac-toe">
      <div className="turn-order">
        {state.players.map((id, i) => (
          <span key={id} className={`chip ${!finished && state.turn === i ? 'active' : ''}`}>
            {MARKS[i]} {names[id] ?? '（已離開）'}
            {id === me ? '（你）' : ''}
          </span>
        ))}
      </div>
      {!finished && <p className="turn-hint">{myTurn ? '輪到你了！' : `輪到 ${names[state.players[state.turn]] ?? '…'}`}</p>}
      <div className="ttt-board">
        {state.board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${state.winLine?.includes(i) ? 'win' : ''}`}
            disabled={!myTurn || cell !== null}
            onClick={() => play(i)}
            aria-label={`第 ${i + 1} 格`}
          >
            {cell === null ? '' : MARKS[cell]}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
