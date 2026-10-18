import { GameError, type GameResult } from '../types';
import { nameOf } from '../helpers';
import { createRng, randomSeed } from '../rng';
import { shuffle } from '../shuffle';

export const SIZE = 8;
export const SHIPS = [4, 3, 3, 2, 2];

export interface BattleshipState {
  players: [string, string];
  /** 每位玩家的艦隊：每艘船是一組格子編號 */
  fleets: Record<string, number[][]>;
  /** 每位玩家打過的格子（打在對手的海域） */
  shots: Record<string, number[]>;
  ready: Record<string, boolean>;
  turn: 0 | 1;
  seed: number;
  winner: string | null;
  lastShot: { by: string; cell: number; hit: boolean; sunk: boolean } | null;
}

export type BattleshipMove = { type: 'shuffle' } | { type: 'ready' } | { type: 'fire'; cell: number };

/** 隨機擺放艦隊（船不重疊） */
export function placeFleet(random: () => number): number[][] {
  const taken = new Set<number>();
  return SHIPS.map((len) => {
    for (;;) {
      const horizontal = random() < 0.5;
      const r = Math.floor(random() * (horizontal ? SIZE : SIZE - len + 1));
      const c = Math.floor(random() * (horizontal ? SIZE - len + 1 : SIZE));
      const cells = Array.from({ length: len }, (_, i) => (horizontal ? r * SIZE + c + i : (r + i) * SIZE + c));
      if (cells.every((x) => !taken.has(x))) {
        cells.forEach((x) => taken.add(x));
        return cells;
      }
    }
  });
}

export function setup(playerIds: string[], random: () => number): BattleshipState {
  const [a, b] = shuffle(playerIds, random);
  return {
    players: [a, b],
    fleets: { [a]: placeFleet(random), [b]: placeFleet(random) },
    shots: { [a]: [], [b]: [] },
    ready: {},
    turn: 0,
    seed: randomSeed(random),
    winner: null,
    lastShot: null,
  };
}

export function opponentOf(state: BattleshipState, id: string): string {
  return state.players[0] === id ? state.players[1] : state.players[0];
}

export function isSunk(ship: number[], shots: number[]): boolean {
  return ship.every((c) => shots.includes(c));
}

export function bothReady(state: BattleshipState): boolean {
  return state.players.every((id) => state.ready[id]);
}

export function applyMove(state: BattleshipState, playerId: string, move: BattleshipMove): BattleshipState {
  if (state.winner) throw new GameError('這局已經結束了');
  if (!state.players.includes(playerId)) throw new GameError('你沒有參加這一局');

  if (move.type === 'shuffle' || move.type === 'ready') {
    if (state.ready[playerId]) throw new GameError('你已經準備好了');
    if (move.type === 'ready') return { ...state, ready: { ...state.ready, [playerId]: true } };
    const rng = createRng(state.seed);
    return { ...state, fleets: { ...state.fleets, [playerId]: placeFleet(rng.random) }, seed: rng.seed };
  }

  if (!bothReady(state)) throw new GameError('還有人在擺船');
  if (state.players[state.turn] !== playerId) throw new GameError('還沒輪到你');
  const { cell } = move;
  if (!Number.isInteger(cell) || cell < 0 || cell >= SIZE * SIZE) throw new GameError('沒有這一格');
  if (state.shots[playerId].includes(cell)) throw new GameError('這裡已經打過了');

  const shots = [...state.shots[playerId], cell];
  const enemyFleet = state.fleets[opponentOf(state, playerId)];
  const ship = enemyFleet.find((s) => s.includes(cell));
  const allSunk = enemyFleet.every((s) => isSunk(s, shots));
  return {
    ...state,
    shots: { ...state.shots, [playerId]: shots },
    turn: state.turn === 0 ? 1 : 0,
    winner: allSunk ? playerId : null,
    lastShot: { by: playerId, cell, hit: !!ship, sunk: !!ship && isSunk(ship, shots) },
  };
}

export function getResult(state: BattleshipState, names: Record<string, string>): GameResult | null {
  if (!state.winner) return null;
  return {
    points: { [state.winner]: 1 },
    message: `🚢 ${nameOf(names, state.winner)} 擊沉了全部敵艦，用了 ${state.shots[state.winner].length} 砲！`,
  };
}
