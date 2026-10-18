import { battleship } from './battleship';
import { bullsCows } from './bulls-cows';
import { colorChain } from './color-chain';
import { connectFour } from './connect-four';
import { dotsBoxes } from './dots-boxes';
import { drawGuess } from './draw-guess';
import { guessBomb } from './guess-bomb';
import { liarDice } from './liar-dice';
import { memory } from './memory';
import { mindMeld } from './mind-meld';
import { othello } from './othello';
import { reaction } from './reaction';
import { rps } from './rps';
import { takeSix } from './take-six';
import { tapRace } from './tap-race';
import { ticTacToe } from './tic-tac-toe';
import { undercover } from './undercover';
import type { AnyGame } from './types';

/** 新增遊戲：在 src/games/ 底下建立資料夾、實作 GameModule，再加進這個陣列即可。 */
export const GAMES: AnyGame[] = [
  // 3 人以上
  undercover,
  // 2–4 人
  guessBomb,
  drawGuess,
  liarDice,
  takeSix,
  colorChain,
  mindMeld,
  bullsCows,
  reaction,
  tapRace,
  rps,
  memory,
  dotsBoxes,
  // 2 人
  othello,
  battleship,
  connectFour,
  ticTacToe,
];

export function getGame(id: string): AnyGame | undefined {
  return GAMES.find((g) => g.id === id);
}
