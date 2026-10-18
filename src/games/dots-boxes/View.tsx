import type { GameViewProps } from '../types';
import { nameOf, PLAYER_COLORS, useMove } from '../helpers';
import { boxCounts, currentPlayer, SIZE, type DotsBoxesMove, type DotsBoxesState } from './logic';

export function DotsBoxesView({ state, me, names, sendMove, finished }: GameViewProps<DotsBoxesState, DotsBoxesMove>) {
  const { send, error, busy } = useMove(sendMove);
  const turnId = currentPlayer(state);
  const myTurn = !finished && me === turnId;
  const colorOf = (id: string) => PLAYER_COLORS[state.order.indexOf(id) % PLAYER_COLORS.length];
  const counts = boxCounts(state);

  // 畫成 (2×SIZE+1)² 的格子：偶數列/行是點與線，奇數列+奇數行是格子
  const n = SIZE * 2 + 1;
  const cells = [];
  for (let gr = 0; gr < n; gr++) {
    for (let gc = 0; gc < n; gc++) {
      const key = `${gr}-${gc}`;
      if (gr % 2 === 0 && gc % 2 === 0) {
        cells.push(<span key={key} className="db-dot" />);
      } else if (gr % 2 === 1 && gc % 2 === 1) {
        const owner = state.boxes[`${(gr - 1) / 2}-${(gc - 1) / 2}`];
        cells.push(
          <span key={`${key}-${owner ?? ''}`} className={`db-box ${owner ? 'pop-in' : ''}`} style={owner ? { background: colorOf(owner) } : undefined} />,
        );
      } else {
        const line = gr % 2 === 0 ? `h-${gr / 2}-${(gc - 1) / 2}` : `v-${(gr - 1) / 2}-${gc / 2}`;
        const drawer = state.lines[line];
        cells.push(
          <button
            key={key}
            className={`db-line ${gr % 2 === 0 ? 'h' : 'v'} ${drawer ? 'drawn' : ''} ${state.lastLine === line ? 'last' : ''}`}
            style={drawer ? { background: colorOf(drawer) } : undefined}
            disabled={!myTurn || busy || !!drawer}
            onClick={() => send({ line })}
            aria-label={drawer ? '已畫的線' : '畫這條線'}
          />,
        );
      }
    }
  }

  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      <div className="turn-order">
        {state.order.map((id) => (
          <span key={id} className={`chip ${id === turnId && !finished ? 'active' : ''}`}>
            <span className="color-dot" style={{ background: colorOf(id) }} />
            {nameOf(names, id)}
            {id === me ? '（你）' : ''}：{counts[id]} 格
          </span>
        ))}
      </div>
      {!finished && <p className="turn-hint">{myTurn ? '輪到你畫線！' : `輪到 ${nameOf(names, turnId)}`}</p>}
      <div className="db-board" style={{ gridTemplateColumns: `repeat(${SIZE}, 10px 1fr) 10px`, gridTemplateRows: `repeat(${SIZE}, 10px 1fr) 10px` }}>
        {cells}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
