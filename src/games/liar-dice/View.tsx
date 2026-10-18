import { useEffect, useState } from 'react';
import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import {
  currentPlayer,
  DICE_PER_PLAYER,
  isValidBid,
  nextMinBid,
  totalDice,
  type LiarDiceMove,
  type LiarDiceState,
} from './logic';

const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function Dice({ values, highlight }: { values: number[]; highlight?: number }) {
  return (
    <span className="dice-row">
      {values.map((v, i) => (
        <span key={i} className={`die ${highlight && (v === highlight || v === 1) ? 'hit' : ''}`}>
          {FACES[v]}
        </span>
      ))}
    </span>
  );
}

export function LiarDiceView({ state, me, names, sendMove, finished }: GameViewProps<LiarDiceState, LiarDiceMove>) {
  const { send, error, busy } = useMove(sendMove);
  const last = state.bids[state.bids.length - 1];
  const turnId = currentPlayer(state);
  const myTurn = !finished && me === turnId;
  const [bid, setBid] = useState(() => nextMinBid(state));

  // 別人喊完後，把預設值更新成目前能喊的最小值
  useEffect(() => setBid(nextMinBid(state)), [state.bids.length]);

  const valid = isValidBid(state, bid.quantity, bid.face);

  return (
    <div className="liar-dice stack">
      <div className="center stack-sm" style={{ alignItems: 'center' }}>
        <span className="muted">目前喊到</span>
        <div className="big-bid">{last ? <>{last.quantity} 個 {FACES[last.face]}</> : '—'}</div>
        {last && <span className="muted">由 {nameOf(names, last.by)} 喊出</span>}
      </div>

      {me && state.dice[me] && !finished && (
        <div className="center">
          <div className="muted">你的骰子（只有你看得到）</div>
          <Dice values={state.dice[me]} />
        </div>
      )}

      {!finished && <p className="turn-hint">{myTurn ? '輪到你了！' : `輪到 ${nameOf(names, turnId)}`}</p>}

      {myTurn && (
        <div className="stack-sm" style={{ alignItems: 'center' }}>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button onClick={() => setBid((b) => ({ ...b, quantity: Math.max(1, b.quantity - 1) }))} aria-label="減少">
              −
            </button>
            <strong className="bid-qty">{bid.quantity} 個</strong>
            <button
              onClick={() => setBid((b) => ({ ...b, quantity: Math.min(totalDice(state), b.quantity + 1) }))}
              aria-label="增加"
            >
              ＋
            </button>
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            {[2, 3, 4, 5, 6].map((f) => (
              <button
                key={f}
                className={`face-btn ${bid.face === f ? 'selected' : ''}`}
                onClick={() => setBid((b) => ({ ...b, face: f }))}
                aria-label={`${f} 點`}
              >
                {FACES[f]}
              </button>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="primary" disabled={busy || !valid} onClick={() => send({ type: 'bid', ...bid })}>
              喊 {bid.quantity} 個 {FACES[bid.face]}
            </button>
            {last && (
              <button className="danger" disabled={busy} onClick={() => send({ type: 'challenge' })}>
                開！
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p className="error center">{error}</p>}

      <div className="dice-table">
        {state.order.map((id) => (
          <div key={id} className={`dice-seat ${id === turnId && !finished ? 'active' : ''} ${state.reveal?.loser === id ? 'loser' : ''}`}>
            <span>
              {nameOf(names, id)}
              {id === me ? '（你）' : ''}
            </span>
            {finished ? (
              <span className="roll-in">
                <Dice values={state.dice[id]} highlight={last?.face} />
              </span>
            ) : (
              <span className="muted">🎲 × {DICE_PER_PLAYER}</span>
            )}
          </div>
        ))}
      </div>

      {state.bids.length > 0 && (
        <ol className="guess-log" reversed>
          {[...state.bids].reverse().map((b, i) => (
            <li key={state.bids.length - i}>
              <span>{nameOf(names, b.by)}</span>
              <span className="muted">喊</span>
              <strong>
                {b.quantity} 個 {FACES[b.face]}
              </strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
