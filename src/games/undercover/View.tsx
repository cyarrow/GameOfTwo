import { useState, type FormEvent } from 'react';
import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { currentDescriber, wordOf, type UndercoverMove, type UndercoverState } from './logic';

export function UndercoverView({ state, me, names, sendMove, finished }: GameViewProps<UndercoverState, UndercoverMove>) {
  const { send, error, busy } = useMove(sendMove);
  const [text, setText] = useState('');
  const describer = currentDescriber(state);
  const alive = !!me && state.alive.includes(me);
  const rounds = Array.from({ length: state.round }, (_, i) => i + 1);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = await send({ type: 'describe', round: state.round, text });
    if (!err) setText('');
  }

  return (
    <div className="stack">
      {me && (
        <div className="uc-word">
          <span className="muted">你的詞（只有你看得到）</span>
          <strong>{wordOf(state, me)}</strong>
          {!finished && <small className="muted">你不知道自己是不是臥底。描述時要模糊一點，別讓臥底猜到詞！</small>}
          {finished && <small>{me === state.spy ? '你是臥底 🕵️' : '你是平民'}</small>}
        </div>
      )}

      {!finished && (
        <p className="turn-hint">
          第 {state.round} 輪 ·{' '}
          {state.phase === 'describe'
            ? describer === me
              ? '輪到你描述！'
              : `等 ${nameOf(names, describer!)} 描述…`
            : alive && !(me in state.votes)
              ? '投票：你覺得誰是臥底？'
              : '等其他人投票…'}
        </p>
      )}
      {me && !alive && !finished && <p className="notice">你已經被淘汰了，可以繼續看大家怎麼玩。</p>}

      {state.phase === 'describe' && describer === me && !finished && (
        <form className="row" onSubmit={submit}>
          <input value={text} maxLength={30} onChange={(e) => setText(e.target.value)} placeholder="用一句話描述你的詞" autoFocus aria-label="描述" />
          <button type="submit" className="primary" disabled={busy || !text.trim()}>
            送出
          </button>
        </form>
      )}

      {state.phase === 'vote' && alive && !(me! in state.votes) && !finished && (
        <div className="row" style={{ justifyContent: 'center' }}>
          {state.alive
            .filter((id) => id !== me)
            .map((id) => (
              <button key={id} className="danger" disabled={busy} onClick={() => send({ type: 'vote', round: state.round, target: id })}>
                投 {nameOf(names, id)}
              </button>
            ))}
        </div>
      )}
      {error && <p className="error center">{error}</p>}

      {rounds.map((r) => {
        const descs = state.descriptions.filter((d) => d.round === r);
        const result = state.voteLog.find((v) => v.round === r);
        if (descs.length === 0 && !result) return null;
        return (
          <div key={r} className="uc-round">
            <div className="muted">第 {r} 輪</div>
            <ul>
              {descs.map((d) => (
                <li key={d.by}>
                  <strong>{nameOf(names, d.by)}</strong>：{d.text}
                </li>
              ))}
            </ul>
            {result && (
              <p>
                🗳️{' '}
                {Object.entries(result.votes)
                  .map(([voter, target]) => `${nameOf(names, voter)}→${nameOf(names, target)}`)
                  .join('、')}
                <br />
                {result.out
                  ? `${nameOf(names, result.out)} 被淘汰，${result.out === state.spy ? '是臥底！' : '不是臥底…'}`
                  : '平票，沒有人被淘汰'}
              </p>
            )}
          </div>
        );
      })}

      <div className="turn-order">
        {state.order.map((id) => (
          <span key={id} className={`chip ${id === describer ? 'active' : ''} ${state.alive.includes(id) ? '' : 'out'}`}>
            {state.phase === 'vote' && !finished && state.alive.includes(id) && (id in state.votes ? '✅ ' : '⏳ ')}
            {finished && id === state.spy && '🕵️ '}
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
