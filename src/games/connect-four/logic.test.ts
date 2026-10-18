import { describe, expect, it } from 'vitest';
import { applyMove, COLS, getResult, ROWS, setup, type ConnectFourState } from './logic';

function play(s: ConnectFourState, cols: number[]): ConnectFourState {
  for (const col of cols) s = applyMove(s, s.players[s.turn], { col });
  return s;
}

describe('四子棋', () => {
  it('棋子會掉到最下面', () => {
    const s = play(setup(['a', 'b'], () => 0), [3, 3]);
    expect(s.board[(ROWS - 1) * COLS + 3]).toBe(0);
    expect(s.board[(ROWS - 2) * COLS + 3]).toBe(1);
  });

  it('橫向、直向、斜向連四獲勝', () => {
    const horizontal = play(setup(['a', 'b'], () => 0), [0, 0, 1, 1, 2, 2, 3]);
    expect(horizontal.winner).toBe(0);
    const vertical = play(setup(['a', 'b'], () => 0), [0, 1, 0, 1, 0, 1, 0]);
    expect(vertical.winLine).toHaveLength(4);
    const diagonal = play(setup(['a', 'b'], () => 0), [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]);
    expect(diagonal.winner).toBe(0);
    expect(getResult(diagonal, {})!.points).toEqual({ [diagonal.players[0]]: 1 });
  });

  it('滿的那一行不能下', () => {
    const s = play(setup(['a', 'b'], () => 0), [0, 0, 0, 0, 0, 0]);
    expect(() => applyMove(s, s.players[s.turn], { col: 0 })).toThrow('滿了');
  });
});
