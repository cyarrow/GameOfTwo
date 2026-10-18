import type { GameViewProps } from '../types';
import { nameOf, useMove } from '../helpers';
import { bothReady, isSunk, opponentOf, SHIPS, SIZE, type BattleshipMove, type BattleshipState } from './logic';

function Grid({
  fleet,
  shots,
  showShips,
  onFire,
  last,
}: {
  fleet: number[][];
  shots: number[];
  showShips: boolean;
  onFire?: (cell: number) => void;
  last?: number;
}) {
  const shipCells = new Set(fleet.flat());
  const sunkCells = new Set(fleet.filter((s) => isSunk(s, shots)).flat());
  const shot = new Set(shots);
  return (
    <div className="bs-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
      {Array.from({ length: SIZE * SIZE }, (_, i) => {
        const hit = shot.has(i) && shipCells.has(i);
        const miss = shot.has(i) && !shipCells.has(i);
        const cls = [
          'bs-cell',
          showShips && shipCells.has(i) ? 'ship' : '',
          sunkCells.has(i) ? 'sunk' : '',
          hit ? 'hit' : '',
          miss ? 'miss' : '',
          last === i ? 'last' : '',
        ].join(' ');
        return onFire ? (
          <button key={i} className={cls} disabled={shot.has(i)} onClick={() => onFire(i)} aria-label={`開砲第 ${i + 1} 格`}>
            {hit ? '💥' : miss ? '·' : ''}
          </button>
        ) : (
          <span key={i} className={cls}>
            {hit ? '💥' : miss ? '·' : ''}
          </span>
        );
      })}
    </div>
  );
}

export function BattleshipView({ state, me, names, sendMove, finished }: GameViewProps<BattleshipState, BattleshipMove>) {
  const { send, error, busy } = useMove(sendMove);
  const placing = !bothReady(state);
  // 觀戰者從第一位玩家的角度看
  const viewer = me ?? state.players[0];
  const enemy = opponentOf(state, viewer);
  const myTurn = !finished && !placing && state.players[state.turn] === me;
  const enemySunk = state.fleets[enemy].filter((s) => isSunk(s, state.shots[viewer])).length;
  const last = state.lastShot;

  return (
    <div className="stack">
      {placing ? (
        <>
          <p className="turn-hint">
            {me && !state.ready[me] ? '擺好你的艦隊：不滿意可以重新擺放' : '等待對手擺好艦隊…'}
          </p>
          {me && !state.ready[me] && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button disabled={busy} onClick={() => send({ type: 'shuffle' })}>
                🔀 重新擺放
              </button>
              <button className="primary" disabled={busy} onClick={() => send({ type: 'ready' })}>
                準備好了
              </button>
            </div>
          )}
          <div className="center">
            <div className="muted">我的艦隊（船長 {SHIPS.join('、')} 格）</div>
            <Grid fleet={state.fleets[viewer]} shots={[]} showShips />
          </div>
        </>
      ) : (
        <>
          {!finished && (
            <p className="turn-hint">
              {last && `${nameOf(names, last.by)} ${last.sunk ? '擊沉一艘船！' : last.hit ? '命中！' : '沒打中。'} `}
              {myTurn ? '輪到你開砲！' : `輪到 ${nameOf(names, state.players[state.turn])}`}
            </p>
          )}
          <div className="bs-boards">
            <div className="center">
              <div className="muted">
                敵方海域（{nameOf(names, enemy)}）· 擊沉 {enemySunk}/{SHIPS.length}
              </div>
              <Grid
                fleet={state.fleets[enemy]}
                shots={state.shots[viewer]}
                showShips={finished}
                onFire={myTurn && !busy ? (cell) => send({ type: 'fire', cell }) : undefined}
                last={last?.by === viewer ? last.cell : undefined}
              />
            </div>
            <div className="center">
              <div className="muted">我的艦隊{me ? '' : `（${nameOf(names, viewer)}）`}</div>
              <Grid
                fleet={state.fleets[viewer]}
                shots={state.shots[enemy]}
                showShips
                last={last?.by === enemy ? last.cell : undefined}
              />
            </div>
          </div>
        </>
      )}
      {error && <p className="error center">{error}</p>}
    </div>
  );
}
