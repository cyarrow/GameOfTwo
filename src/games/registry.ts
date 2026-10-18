import { guessBomb } from './guess-bomb';
import { ticTacToe } from './tic-tac-toe';
import type { AnyGame } from './types';

/** 新增遊戲：在 src/games/ 底下建立資料夾、實作 GameModule，再加進這個陣列即可。 */
export const GAMES: AnyGame[] = [guessBomb, ticTacToe];

export function getGame(id: string): AnyGame | undefined {
  return GAMES.find((g) => g.id === id);
}
