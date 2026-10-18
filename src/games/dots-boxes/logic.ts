import { GameError, type GameResult } from '../types';
import { joinNames, pointsForTop } from '../helpers';
import { shuffle } from '../shuffle';

/** 4 × 4 個格子（5 × 5 個點） */
export const SIZE = 4;

/**
 * 線的編號：
 * 橫線 `h-r-c`：第 r 列的點（0..SIZE）之間、第 c 段（0..SIZE-1）
 * 直線 `v-r-c`：第 r 段（0..SIZE-1）、第 c 行的點（0..SIZE）
 * 格子 `r-c`：0..SIZE-1
 */
export interface DotsBoxesState {
  order: string[];
  turn: number;
  lines: Record<string, string>;
  boxes: Record<string, string>;
  lastLine: string | null;
}

export interface DotsBoxesMove {
  line: string;
}

export function setup(playerIds: string[], random: () => number): DotsBoxesState {
  return { order: shuffle(playerIds, random), turn: 0, lines: {}, boxes: {}, lastLine: null };
}

export function currentPlayer(state: DotsBoxesState): string {
  return state.order[state.turn];
}

export function isFinished(state: DotsBoxesState): boolean {
  return Object.keys(state.boxes).length === SIZE * SIZE;
}

function parseLine(line: string): { dir: 'h' | 'v'; r: number; c: number } | null {
  const m = /^([hv])-(\d+)-(\d+)$/.exec(line);
  if (!m) return null;
  const dir = m[1] as 'h' | 'v';
  const r = Number(m[2]);
  const c = Number(m[3]);
  const ok = dir === 'h' ? r <= SIZE && c < SIZE : r < SIZE && c <= SIZE;
  return ok ? { dir, r, c } : null;
}

function boxComplete(lines: Record<string, string>, r: number, c: number): boolean {
  return [`h-${r}-${c}`, `h-${r + 1}-${c}`, `v-${r}-${c}`, `v-${r}-${c + 1}`].every((l) => l in lines);
}

export function applyMove(state: DotsBoxesState, playerId: string, move: DotsBoxesMove): DotsBoxesState {
  if (isFinished(state)) throw new GameError('這局已經結束了');
  if (currentPlayer(state) !== playerId) throw new GameError('還沒輪到你');
  const parsed = parseLine(move.line);
  if (!parsed) throw new GameError('沒有這條線');
  if (move.line in state.lines) throw new GameError('這條線已經有人畫了');

  const lines = { ...state.lines, [move.line]: playerId };
  const { dir, r, c } = parsed;
  // 每條線最多影響兩側的兩個格子
  const neighbors = dir === 'h' ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]];
  const boxes = { ...state.boxes };
  let scored = false;
  for (const [br, bc] of neighbors) {
    if (br < 0 || bc < 0 || br >= SIZE || bc >= SIZE) continue;
    if (boxComplete(lines, br, bc)) {
      boxes[`${br}-${bc}`] = playerId;
      scored = true;
    }
  }
  // 圍到格子的人可以再畫一條
  const turn = scored ? state.turn : (state.turn + 1) % state.order.length;
  return { ...state, lines, boxes, turn, lastLine: move.line };
}

export function boxCounts(state: DotsBoxesState): Record<string, number> {
  const counts = Object.fromEntries(state.order.map((id) => [id, 0]));
  for (const owner of Object.values(state.boxes)) if (owner in counts) counts[owner]++;
  return counts;
}

export function getResult(state: DotsBoxesState, names: Record<string, string>): GameResult | null {
  if (!isFinished(state)) return null;
  const counts = boxCounts(state);
  const { winners, points } = pointsForTop(counts);
  return { points, message: `🔲 ${joinNames(names, winners)} 圍到 ${counts[winners[0]]} 格獲勝！` };
}
