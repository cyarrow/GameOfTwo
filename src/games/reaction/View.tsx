import { useEffect, useRef, useState } from 'react';
import type { GameViewProps } from '../types';
import { joinNames, nameOf } from '../helpers';
import {
  FALSE_START,
  isFinished,
  ROUNDS,
  roundWinners,
  TIMEOUT_MS,
  type ReactionMove,
  type ReactionState,
} from './logic';

type Phase = 'wait' | 'go' | 'done';

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '…';
  if (ms === FALSE_START) return '太早按！';
  return `${ms} ms`;
}

export function ReactionView({ state, me, names, sendMove }: GameViewProps<ReactionState, ReactionMove>) {
  const finished = isFinished(state);
  const submitted = !me || finished || me in state.results[state.round];
  const [phase, setPhase] = useState<Phase>('wait');
  const goAt = useRef(0);
  const sentRound = useRef(-1);

  function submit(round: number, ms: number) {
    if (sentRound.current === round) return;
    sentRound.current = round;
    setPhase('done');
    void sendMove({ round, ms });
  }

  // 每一輪各自在自己的裝置上計時：等待隨機時間後變綠，量的是自己的反應時間，不受網路延遲影響
  useEffect(() => {
    if (submitted) return;
    const round = state.round;
    setPhase('wait');
    const toGo = setTimeout(() => {
      goAt.current = performance.now();
      setPhase('go');
    }, state.delays[round]);
    const timeout = setTimeout(() => submit(round, TIMEOUT_MS), state.delays[round] + TIMEOUT_MS);
    return () => {
      clearTimeout(toGo);
      clearTimeout(timeout);
    };
  }, [state.round, submitted]);

  function tap() {
    if (submitted || phase === 'done') return;
    if (phase === 'wait') submit(state.round, FALSE_START);
    else submit(state.round, Math.min(TIMEOUT_MS, Math.round(performance.now() - goAt.current)));
  }

  const previous = state.round > 0 ? state.results[state.round - 1] : null;
  const previousWinners = previous ? roundWinners(previous) : [];
  const shownPhase: Phase = submitted ? 'done' : phase;

  return (
    <div className="stack">
      {!finished && (
        <p className="turn-hint">
          第 {state.round + 1} / {ROUNDS} 輪
        </p>
      )}

      {!finished && me && (
        <button className={`reaction-pad ${shownPhase}`} onPointerDown={tap}>
          {shownPhase === 'wait' && '等它變綠色…'}
          {shownPhase === 'go' && '按！'}
          {shownPhase === 'done' && `你：${formatMs(state.results[state.round][me])}，等其他人…`}
        </button>
      )}

      {previous && (
        <div className="rps-last">
          <div className="muted">第 {state.round} 輪結果</div>
          <div className="turn-order">
            {state.players.map((id) => (
              <span key={id} className={`chip ${previousWinners.includes(id) ? 'active' : ''}`}>
                {nameOf(names, id)}：{formatMs(previous[id])}
              </span>
            ))}
          </div>
          <strong>{previousWinners.length ? `${joinNames(names, previousWinners)} 最快！` : '大家都太早按了！'}</strong>
        </div>
      )}

      <div className="turn-order">
        {state.players.map((id) => (
          <span key={id} className="chip">
            {!finished && (id in state.results[state.round] ? '✅ ' : '⏳ ')}
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}：贏 {state.wins[id]} 輪
          </span>
        ))}
      </div>
    </div>
  );
}
