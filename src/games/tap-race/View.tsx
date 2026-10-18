import { useEffect, useRef, useState } from 'react';
import type { GameViewProps } from '../types';
import { nameOf, PLAYER_COLORS, useMove } from '../helpers';
import { COUNTDOWN_SECONDS, DURATION_SECONDS, type TapRaceMove, type TapRaceState } from './logic';

type Phase = 'waiting' | 'countdown' | 'tapping' | 'done';

export function TapRaceView({ state, me, names, sendMove, finished }: GameViewProps<TapRaceState, TapRaceMove>) {
  const { send, error } = useMove(sendMove);
  const [now, setNow] = useState(() => performance.now());
  const [myCount, setMyCount] = useState(0);
  const startRef = useRef<number | null>(null);
  const sentRef = useRef({ count: 0, final: false });
  const countRef = useRef(0);

  const playing = !!me && state.started && !state.done[me] && !finished;
  if (playing && startRef.current === null) startRef.current = performance.now();

  const elapsed = startRef.current === null ? 0 : (now - startRef.current) / 1000;
  const phase: Phase = !playing
    ? me && state.done[me]
      ? 'done'
      : 'waiting'
    : elapsed < COUNTDOWN_SECONDS
      ? 'countdown'
      : elapsed < COUNTDOWN_SECONDS + DURATION_SECONDS
        ? 'tapping'
        : 'done';

  // 遊戲進行中每 100ms 更新畫面，並約每 0.5 秒把目前次數同步給其他人
  useEffect(() => {
    if (!playing) return;
    let tick = 0;
    const timer = setInterval(() => {
      setNow(performance.now());
      tick++;
      const t = (performance.now() - startRef.current!) / 1000;
      if (t >= COUNTDOWN_SECONDS + DURATION_SECONDS) {
        if (!sentRef.current.final) {
          sentRef.current.final = true;
          void sendMove({ type: 'final', count: countRef.current });
        }
      } else if (tick % 5 === 0 && countRef.current !== sentRef.current.count) {
        sentRef.current.count = countRef.current;
        void sendMove({ type: 'progress', count: countRef.current });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [playing]);

  function tap() {
    if (phase !== 'tapping') return;
    countRef.current += 1;
    setMyCount(countRef.current);
  }

  useEffect(() => {
    if (phase !== 'tapping') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const counts = { ...state.counts, ...(me && phase === 'tapping' ? { [me]: myCount } : {}) };
  const max = Math.max(20, ...Object.values(counts));

  return (
    <div className="stack">
      {!state.started ? (
        <div className="stack-sm" style={{ alignItems: 'center' }}>
          <p>全員按下準備後，倒數 {COUNTDOWN_SECONDS} 秒開始，{DURATION_SECONDS} 秒內比誰點得多！</p>
          {me && !state.ready[me] ? (
            <button className="primary big" onClick={() => send({ type: 'ready' })}>
              我準備好了
            </button>
          ) : (
            me && <p className="muted">等待其他人準備…</p>
          )}
        </div>
      ) : phase === 'countdown' ? (
        <div className="tap-big">{Math.ceil(COUNTDOWN_SECONDS - elapsed)}</div>
      ) : phase === 'tapping' ? (
        <div className="stack-sm" style={{ alignItems: 'center' }}>
          <div className="muted">剩下 {Math.max(0, COUNTDOWN_SECONDS + DURATION_SECONDS - elapsed).toFixed(1)} 秒</div>
          <button
            className="tap-button"
            onPointerDown={(e) => {
              e.preventDefault();
              tap();
            }}
          >
            {myCount}
            <small>狂點這裡！（或按空白鍵）</small>
          </button>
        </div>
      ) : (
        !finished && me && <p className="center muted">時間到！你點了 {state.counts[me]} 下，等待其他人完成…</p>
      )}
      {error && <p className="error center">{error}</p>}

      <div className="race-bars">
        {state.players.map((id, i) => (
          <div key={id} className="race-row">
            <span className="race-name">
              {!state.started && (state.ready[id] ? '✅ ' : '⏳ ')}
              {nameOf(names, id)}
              {id === me ? '（你）' : ''}
            </span>
            <div className="race-track">
              <div
                className="race-fill"
                style={{ width: `${(counts[id] / max) * 100}%`, background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              />
            </div>
            <strong className="race-count">{counts[id]}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
