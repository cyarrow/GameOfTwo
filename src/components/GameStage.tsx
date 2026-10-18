import { useEffect, useRef, useState } from 'react';
import { getGame } from '../games/registry';
import { gameGradient } from '../games/theme';
import { haptic } from '../platform/haptics';
import { reloadToVersion } from '../platform/useUpdateCheck';
import { Confetti } from './Confetti';
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
  const myTurn = !finished && isPlayer && turnOf(game, match.state) === me;
  const iWon = finished && (match.result!.points[me] ?? 0) > 0;
  const [celebrate, setCelebrate] = useState<number | null>(null);

  // 輪到自己時輕震一下（狀態回饋）；畫面上的發光由 CSS 處理
  useEffect(() => {
    if (myTurn) haptic(25);
  }, [myTurn]);

  // 只在「這一局剛結束、而且自己贏了」的那一刻慶祝；重新整理後看到已結束的對局不會再噴一次
  const wasFinished = useRef(finished);
  useEffect(() => {
    if (finished && !wasFinished.current && iWon) {
      setCelebrate(Date.now());
      haptic([20, 40, 20]);
    }
    wasFinished.current = finished;
    if (!finished) setCelebrate(null);
  }, [finished, iWon, match.id]);

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
        <p className="error">找不到這個遊戲（{match.gameId}），可能是別人用的是比較新的網站版本。</p>
        <div className="row">
          <button className="primary" onClick={() => reloadToVersion(Date.now().toString(36))}>
            更新網站
          </button>
          {isHost && <button onClick={() => run(() => backToLobby(room.code, me))}>回大廳</button>}
        </div>
      </div>
    );
  }

  const View = game.View;

  return (
    <div className={`card stack stage ${myTurn ? 'my-turn' : ''}`}>
      <div className="stage-band" style={{ background: gameGradient(game.id) }} aria-hidden="true" />
      <div className="stage-header">
        <h2>
          <span className="stage-emoji" style={{ background: gameGradient(game.id) }}>
            {game.emoji}
          </span>
          {game.name}
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
          {celebrate && <Confetti key={celebrate} />}
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

/** 遊戲有提供 whoseTurn 才有「輪到你」的提示；出錯時（例如舊版狀態）當作沒有 */
function turnOf(game: ReturnType<typeof getGame>, state: unknown): string | null {
  try {
    return game?.whoseTurn?.(state) ?? null;
  } catch {
    return null;
  }
}
