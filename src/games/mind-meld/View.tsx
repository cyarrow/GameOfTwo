import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { isFinished, type MindMeldMove, type MindMeldState } from './logic';
import { QUESTIONS } from './questions';

export function MindMeldView({ state, me, names, sendMove }: GameViewProps<MindMeldState, MindMeldMove>) {
  const { send, error, busy } = useMove(sendMove);
  const question = QUESTIONS[state.questions[state.round]];
  const answers = state.answers[state.round];
  const myAnswer = me ? answers[me] : undefined;
  const answeredCount = state.players.filter((id) => id in answers).length;

  return (
    <div className="stack">
      <div className="center muted">
        第 {state.round + 1} / {state.questions.length} 題
      </div>
      <h3 className="question">{question.q}</h3>

      <div className="option-grid">
        {question.options.map((opt, i) => {
          const pickers = state.revealed ? state.players.filter((id) => answers[id] === i) : [];
          return (
            <button
              key={i}
              className={`option ${myAnswer === i ? 'selected' : ''} ${pickers.length > 1 ? 'match' : ''}`}
              disabled={!me || state.revealed || busy}
              onClick={() => send({ type: 'answer', round: state.round, option: i })}
            >
              <span>{opt}</span>
              {state.revealed && pickers.length > 0 && (
                <span className="pickers">{pickers.map((id) => nameOf(names, id)).join('、')}</span>
              )}
            </button>
          );
        })}
      </div>

      {!state.revealed ? (
        <p className="center muted">
          {me && myAnswer === undefined ? '選一個你覺得大家也會選的答案（作答前看不到別人的選擇）' : '已作答，可以在公布前改答案'}
          {' · '}
          {answeredCount}/{state.players.length} 人已作答
        </p>
      ) : (
        !isFinished(state) &&
        me && (
          <button className="primary" style={{ alignSelf: 'center' }} onClick={() => send({ type: 'next', round: state.round })}>
            下一題
          </button>
        )
      )}
      {error && <p className="error center">{error}</p>}

      <div className="turn-order">
        {state.players.map((id) => (
          <span key={id} className="chip">
            {!state.revealed && (id in answers ? '✅ ' : '⏳ ')}
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}：{state.scores[id]} 分
          </span>
        ))}
      </div>
    </div>
  );
}
