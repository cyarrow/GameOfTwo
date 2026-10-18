import { useState } from 'react';
import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import {
  canPlay,
  COLORS,
  currentPlayer,
  DECK,
  topCard,
  type Card,
  type Color,
  type ColorChainMove,
  type ColorChainState,
} from './logic';

const COLOR_NAMES: Record<Color, string> = { r: '紅', y: '黃', g: '綠', b: '藍' };
const LABELS: Record<string, string> = { skip: '⊘', reverse: '⇄', draw2: '+2', wild: '🌈', wild4: '+4' };

function cardLabel(card: Card): string {
  return LABELS[card.value] ?? card.value;
}

function describe(card: Card): string {
  const names: Record<string, string> = { skip: '跳過', reverse: '迴轉', draw2: '+2', wild: '萬用牌', wild4: '萬用 +4' };
  return `${card.color ? COLOR_NAMES[card.color] : ''}${names[card.value] ?? card.value}`;
}

function CardFace({ card, big }: { card: Card; big?: boolean }) {
  return <span className={`cc-card cc-${card.color ?? 'w'} ${big ? 'big' : ''}`}>{cardLabel(card)}</span>;
}

export function ColorChainView({ state, me, names, sendMove, finished }: GameViewProps<ColorChainState, ColorChainMove>) {
  const { send, error, busy } = useMove(sendMove);
  const [pendingWild, setPendingWild] = useState<number | null>(null);
  const turnId = currentPlayer(state);
  const myTurn = !finished && me === turnId;
  const hand = me ? [...(state.hands[me] ?? [])].sort((a, b) => a - b) : [];
  const last = state.last;

  function play(card: number) {
    if (DECK[card].color === null) setPendingWild(card);
    else void send({ type: 'play', card });
  }

  function chooseColor(color: Color) {
    if (pendingWild === null) return;
    void send({ type: 'play', card: pendingWild, color });
    setPendingWild(null);
  }

  return (
    <div className="stack">
      <div className="cc-table">
        <div className="center stack-sm" style={{ alignItems: 'center' }}>
          <span key={state.discard[state.discard.length - 1]} className="throw-in">
            <CardFace card={topCard(state)} big />
          </span>
          <span className={`cc-color-tag cc-${state.color}`}>目前顏色：{COLOR_NAMES[state.color]}</span>
        </div>
        <div className="stack-sm">
          {state.order.map((id) => (
            <span key={id} className={`chip ${id === turnId && !finished ? 'active' : ''}`}>
              {nameOf(names, id)}
              {id === me ? '（你）' : ''}：{state.hands[id].length} 張
            </span>
          ))}
          <span className="muted">順序 {state.direction === 1 ? '↓' : '↑'} · 牌堆 {state.drawPile.length} 張</span>
        </div>
      </div>

      {last && (
        <p className="center muted">
          {nameOf(names, last.by)}{' '}
          {last.kind === 'play' && last.card !== undefined && `出了 ${describe(DECK[last.card])}`}
          {last.kind === 'draw' && '抽了一張牌'}
          {last.kind === 'pass' && '跳過'}
          {last.victim && `，${nameOf(names, last.victim)} 要抽 ${last.penalty} 張！`}
        </p>
      )}
      {!finished && <p className="turn-hint">{myTurn ? (state.drawn !== null ? '抽到可以出的牌！要出嗎？' : '輪到你了！') : `輪到 ${nameOf(names, turnId)}`}</p>}

      {pendingWild !== null && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <span>選擇顏色：</span>
          {COLORS.map((c) => (
            <button key={c} className={`cc-color-btn cc-${c}`} onClick={() => chooseColor(c)}>
              {COLOR_NAMES[c]}
            </button>
          ))}
          <button className="ghost small" onClick={() => setPendingWild(null)}>
            取消
          </button>
        </div>
      )}

      {me && (
        <div className="cc-hand">
          {hand.map((id) => {
            const playable = myTurn && canPlay(state, id) && (state.drawn === null || state.drawn === id);
            return (
              <button key={id} className="cc-hand-btn" disabled={!playable || busy} onClick={() => play(id)} aria-label={describe(DECK[id])}>
                <CardFace card={DECK[id]} />
              </button>
            );
          })}
        </div>
      )}

      {myTurn && (
        <div className="row" style={{ justifyContent: 'center' }}>
          {state.drawn === null ? (
            <button disabled={busy} onClick={() => send({ type: 'draw' })}>
              抽一張
            </button>
          ) : (
            <button disabled={busy} onClick={() => send({ type: 'pass' })}>
              不出，換下一位
            </button>
          )}
        </div>
      )}
      {error && <p className="error center">{error}</p>}
    </div>
  );
}
