import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { bullheads, HAND_SIZE, sumBullheads, type TakeSixMove, type TakeSixState } from './logic';

function Card({ value, onClick, disabled, selected }: { value: number; onClick?: () => void; disabled?: boolean; selected?: boolean }) {
  const heads = bullheads(value);
  const className = `t6-card heads-${heads} ${selected ? 'selected' : ''}`;
  const content = (
    <>
      <span className="t6-num">{value}</span>
      <span className="t6-heads">{'🐮'.repeat(Math.min(heads, 3))}{heads > 3 ? `×${heads}` : ''}</span>
    </>
  );
  return onClick ? (
    <button className={className} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  ) : (
    <span className={className}>{content}</span>
  );
}

export function TakeSixView({ state, me, names, sendMove, finished }: GameViewProps<TakeSixState, TakeSixMove>) {
  const { send, error, busy } = useMove(sendMove);
  const myChoice = me ? state.chosen[me] : undefined;
  const hand = me ? (state.hands[me] ?? []) : [];
  const canPlay = !!me && !finished && myChoice === undefined;

  return (
    <div className="stack">
      {!finished && (
        <p className="turn-hint">
          第 {state.turn} / {HAND_SIZE} 輪：{canPlay ? '選一張牌出！' : me ? '等待其他人出牌…' : '觀戰中'}
        </p>
      )}

      <div className="t6-rows">
        {state.rows.map((row, i) => (
          <div key={i} className="t6-row">
            <span className="t6-row-label">
              第 {i + 1} 排
              <small className="muted">{sumBullheads(row)}🐮</small>
            </span>
            {row.map((c) => (
              <Card key={c} value={c} />
            ))}
            {Array.from({ length: 5 - row.length }, (_, k) => (
              <span key={`empty-${k}`} className={`t6-slot ${row.length + k === 4 ? 'danger' : ''}`} />
            ))}
          </div>
        ))}
      </div>

      {state.lastPlacements.length > 0 && (
        <ul className="t6-log">
          {state.lastPlacements.map((p) => (
            <li key={p.card}>
              <strong>{nameOf(names, p.by)}</strong> 出 {p.card} → 第 {p.row + 1} 排
              {p.took.length > 0 && (
                <span className="error">
                  ，收走 {p.took.length} 張（{sumBullheads(p.took)}🐮）
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {me && hand.length > 0 && (
        <div className="stack-sm" style={{ alignItems: 'stretch' }}>
          <span className="muted">你的手牌（只有你看得到）</span>
          <div className="t6-hand">
            {hand.map((c) => (
              <Card
                key={c}
                value={c}
                selected={myChoice === c}
                disabled={!canPlay || busy}
                onClick={() => send({ turn: state.turn, card: c })}
              />
            ))}
          </div>
        </div>
      )}
      {error && <p className="error center">{error}</p>}

      <div className="turn-order">
        {state.players.map((id) => (
          <span key={id} className="chip">
            {!finished && (id in state.chosen ? '✅ ' : '⏳ ')}
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}：{state.penalties[id]}🐮
          </span>
        ))}
      </div>
    </div>
  );
}
