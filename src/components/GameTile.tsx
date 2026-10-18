import type { ReactNode } from 'react';
import { gameGradient } from '../games/theme';
import type { AnyGame } from '../games/types';
import { playerCountLabel } from '../platform/roomState';

/** 遊戲卡片：上方是遊戲代表色的色塊，下方是名稱、人數與說明 */
export function GameTile({ game, disabled = false, children }: { game: AnyGame; disabled?: boolean; children?: ReactNode }) {
  return (
    <article className={`game-tile ${disabled ? 'disabled' : ''}`}>
      <div className="game-tile-art" style={{ background: gameGradient(game.id) }}>
        <span className="game-tile-emoji">{game.emoji}</span>
        <span className="game-tile-count">{playerCountLabel(game)}</span>
      </div>
      <div className="game-tile-body">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>{game.name}</h3>
          <span className="tag">{game.category}</span>
        </div>
        <p className="muted">{game.description}</p>
        {children}
      </div>
    </article>
  );
}
