import { connectFour } from './connect-four';
import { dotsBoxes } from './dots-boxes';
import { drawGuess } from './draw-guess';
import { guessBomb } from './guess-bomb';
import { liarDice } from './liar-dice';
import { memory } from './memory';
import { mindMeld } from './mind-meld';
import { rps } from './rps';
import { takeSix } from './take-six';
import { tapRace } from './tap-race';
import { ticTacToe } from './tic-tac-toe';
import type { AnyGame } from './types';

/** 新增遊戲：在 src/games/ 底下建立資料夾、實作 GameModule，再加進這個陣列即可。 */
export const GAMES: AnyGame[] = [
  guessBomb,
  drawGuess,
  liarDice,
  takeSix,
  mindMeld,
  tapRace,
  rps,
  memory,
  dotsBoxes,
  connectFour,
  ticTacToe,
];

export function getGame(id: string): AnyGame | undefined {
  return GAMES.find((g) => g.id === id);
}
