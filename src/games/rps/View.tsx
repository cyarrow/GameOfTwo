import type { GameViewProps } from '../types';
import { joinNames, nameOf, useMove } from '../helpers';
import { CHOICES, TARGET_WINS, type Choice, type RpsMove, type RpsState } from './logic';

const ICONS: Record<Choice, string> = { rock: '✊', paper: '🖐️', scissors: '✌️' };
const LABELS: Record<Choice, string> = { rock: '石頭', paper: '布', scissors: '剪刀' };

export function RpsView({ state, me, names, sendMove, finished }: GameViewProps<RpsState, RpsMove>) {
  const { send, error, busy } = useMove(sendMove);
  const myPick = me ? state.picks[me] : undefined;
  const canPick = !!me && !finished && !myPick;

  return (
    <div className="stack">
      {state.last && (
        <div key={state.last.round} className="rps-last pop-in">
          <div className="muted">第 {state.last.round} 輪</div>
          <div className="turn-order">
            {state.players.map((id) => (
              <span key={id} className={`chip ${state.last!.winners.includes(id) ? 'active' : ''}`}>
                {nameOf(names, id)} {ICONS[state.last!.picks[id]]}
              </span>
            ))}
          </div>
          <strong>{state.last.winners.length ? `${joinNames(names, state.last.winners)} 贏了這輪！` : '平手！'}</strong>
        </div>
      )}

      {!finished && (
        <>
          <p className="turn-hint">第 {state.round} 輪：{canPick ? '出拳！' : me ? '等待其他人出拳…' : '觀戰中'}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            {CHOICES.map((c) => (
              <button
                key={c}
                className={`rps-btn ${myPick === c ? 'selected' : ''}`}
                disabled={!canPick || busy}
                onClick={() => send({ round: state.round, choice: c })}
              >
                <span>{ICONS[c]}</span>
                {LABELS[c]}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className="error center">{error}</p>}

      <div className="turn-order">
        {state.players.map((id) => (
          <span key={id} className="chip">
            {!finished && (state.picks[id] ? '✅ ' : '⏳ ')}
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}：{state.wins[id]}/{TARGET_WINS} 勝
          </span>
        ))}
      </div>
    </div>
  );
}
