import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { CANVAS_SIZE, COLORS, drawerOf, isFinished, type DrawGuessMove, type DrawGuessState, type Stroke } from './logic';

const WIDTHS = [6, 14, 32];
/** 兩個點距離小於這個值就不記錄，減少資料量 */
const MIN_POINT_DISTANCE = 4;

function paint(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { p } = stroke;
  ctx.strokeStyle = COLORS[stroke.c];
  ctx.lineWidth = stroke.w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.stroke();
}

export function DrawGuessView({ state, me, names, sendMove }: GameViewProps<DrawGuessState, DrawGuessMove>) {
  const { send, error, busy } = useMove(sendMove);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = useRef<Stroke | null>(null);
  const [pending, setPending] = useState<Stroke[]>([]);
  const [color, setColor] = useState(0);
  const [width, setWidth] = useState(WIDTHS[0]);
  const [guess, setGuess] = useState('');

  const drawer = drawerOf(state);
  const word = state.words[state.round];
  const finished = isFinished(state);
  const canDraw = me === drawer && !state.revealed;
  const canGuess = !!me && me !== drawer && !state.revealed && !state.solved.includes(me);

  function redraw() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (const s of state.strokes) paint(ctx, s);
    for (const s of pending) paint(ctx, s);
    if (current.current) paint(ctx, current.current);
  }

  useEffect(redraw);

  function point(e: PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0, Math.min(CANVAS_SIZE, Math.round(v)));
    return [clamp(((e.clientX - rect.left) / rect.width) * CANVAS_SIZE), clamp(((e.clientY - rect.top) / rect.height) * CANVAS_SIZE)];
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = { c: color, w: width, p: point(e) };
    redraw();
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const s = current.current;
    if (!s) return;
    const [x, y] = point(e);
    const lx = s.p[s.p.length - 2];
    const ly = s.p[s.p.length - 1];
    if (Math.hypot(x - lx, y - ly) < MIN_POINT_DISTANCE) return;
    s.p.push(x, y);
    redraw();
  }

  async function onPointerUp() {
    const s = current.current;
    if (!s) return;
    current.current = null;
    // 只點一下的話補一個點，才畫得出圓點
    if (s.p.length === 2) s.p.push(Math.min(CANVAS_SIZE, s.p[0] + 1), s.p[1]);
    setPending((p) => [...p, s]);
    await send({ type: 'stroke', round: state.round, stroke: s });
    setPending((p) => p.filter((x) => x !== s));
  }

  async function submitGuess(e: FormEvent) {
    e.preventDefault();
    const text = guess;
    if (!text.trim()) return;
    // 先清空，讓玩家可以馬上輸入下一個答案；送出失敗再把原本的文字放回去
    setGuess('');
    const err = await send({ type: 'guess', round: state.round, text });
    if (err) setGuess((current) => current || text);
  }

  return (
    <div className="stack">
      <div className="center">
        <span className="muted">
          第 {state.round + 1} / {state.drawers.length} 題 · {nameOf(names, drawer)} 畫
        </span>
        <div className="dg-word">
          {state.revealed || me === drawer ? (
            <>
              {state.revealed ? '答案：' : '請畫出：'}
              <strong>{word}</strong>
            </>
          ) : (
            <>
              提示：<strong>{word.length} 個字</strong>
            </>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={`dg-canvas ${canDraw ? 'drawing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="畫布"
      />

      {canDraw && (
        <div className="stack-sm" style={{ alignItems: 'center' }}>
          <div className="row" style={{ justifyContent: 'center' }}>
            {COLORS.map((c, i) => (
              <button
                key={c}
                className={`dg-swatch ${color === i ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(i)}
                aria-label={i === COLORS.length - 1 ? '橡皮擦（白色）' : `顏色 ${i + 1}`}
              />
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            {WIDTHS.map((w) => (
              <button key={w} className={`small ${width === w ? 'primary' : ''}`} onClick={() => setWidth(w)}>
                {w === WIDTHS[0] ? '細' : w === WIDTHS[1] ? '中' : '粗'}
              </button>
            ))}
            <button className="small" disabled={busy} onClick={() => send({ type: 'clear', round: state.round })}>
              清除
            </button>
            <button className="small ghost" disabled={busy} onClick={() => send({ type: 'skip', round: state.round })}>
              放棄這題
            </button>
          </div>
        </div>
      )}

      {canGuess && (
        <form className="row" onSubmit={submitGuess}>
          <input value={guess} maxLength={20} onChange={(e) => setGuess(e.target.value)} placeholder="輸入你的答案" aria-label="答案" />
          <button type="submit" className="primary" disabled={!guess.trim()}>
            猜！
          </button>
        </form>
      )}
      {me && state.solved.includes(me) && !state.revealed && <p className="center">✅ 你猜對了！等其他人…</p>}
      {state.revealed && !finished && me && (
        <button className="primary" style={{ alignSelf: 'center' }} onClick={() => send({ type: 'next', round: state.round })}>
          下一題
        </button>
      )}
      {error && <p className="error center">{error}</p>}

      {state.guesses.length > 0 && (
        <ol className="guess-log" reversed>
          {[...state.guesses].reverse().map((g, i) => (
            <li key={state.guesses.length - i}>
              <span>{nameOf(names, g.by)}</span>
              {g.correct ? <strong>✅ 猜對了！</strong> : <span className="muted">{g.text}</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="turn-order">
        {state.players.map((id) => (
          <span key={id} className={`chip ${id === drawer && !finished ? 'active' : ''}`}>
            {id === drawer && !finished ? '🎨 ' : state.solved.includes(id) ? '✅ ' : ''}
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}：{state.scores[id]} 分
          </span>
        ))}
      </div>
    </div>
  );
}
