import { useState } from 'react';
import { getGame } from '../games/registry';
import { ErrorBoundary } from './ErrorBoundary';
import { backToLobby, sendMove, startMatch } from '../platform/room';
import { errorMessage } from '../platform/roomState';
import type { MatchData, Room } from '../platform/types';

export function GameStage({ room, match, me }: { room: Room; match: MatchData; me: string }) {
  const [error, setError] = useState<string | null>(null);
  const game = getGame(match.gameId);
  const isHost = room.hostId === me;
  const isPlayer = match.playerIds.includes(me);
  const finished = match.result !== null;
  const names = Object.fromEntries(room.players.map((p) => [p.id, p.name]));

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (!game) {
    return (
      <div className="card stack">
        <p className="error">找不到這個遊戲（{match.gameId}），可能是網站版本不同，請重新整理。</p>
        {isHost && <button onClick={() => run(() => backToLobby(room.code, me))}>回大廳</button>}
      </div>
    );
  }

  const View = game.View;

  return (
    <div className="card stack">
      <div className="stage-header">
        <h2>
          {game.emoji} {game.name}
        </h2>
        {isHost && !finished && (
          <button
            className="ghost small"
            onClick={() => window.confirm('確定要中止這局嗎？不會計分。') && run(() => backToLobby(room.code, me))}
          >
            中止這局
          </button>
        )}
      </div>

      <details className="rules">
        <summary>遊戲規則</summary>
        <ul>
          {game.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>

      {!isPlayer && <p className="notice">你在這局開始後才加入，目前是觀戰中，下一局就能一起玩。</p>}

      <ErrorBoundary
        key={match.id}
        fallback={<p className="error">遊戲畫面出錯了，可能是網站版本不同。請重新整理，或請房主中止這局。</p>}
      >
      <View
        state={match.state}
        playerIds={match.playerIds}
        me={isPlayer ? me : null}
        names={names}
        sendMove={(move) => sendMove(room.code, me, move)}
        finished={finished}
      />
      </ErrorBoundary>

      {match.result && (
        <div className="result" role="status">
          <p className="result-message">{match.result.message}</p>
          {match.punishment && (
            <div className="punishment">
              <span className="muted">😈 懲罰卡</span>
              <strong>
                {match.punishment.losers.map((id) => names[id] ?? '（已離開）').join('、')}：{match.punishment.text}
              </strong>
            </div>
          )}
          {isHost ? (
            <div className="row">
              <button className="primary" onClick={() => run(() => startMatch(room.code, me, game.id))}>
                再玩一次
              </button>
              <button onClick={() => run(() => backToLobby(room.code, me))}>回大廳選遊戲</button>
            </div>
          ) : (
            <p className="muted">等待房主決定下一步…</p>
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
