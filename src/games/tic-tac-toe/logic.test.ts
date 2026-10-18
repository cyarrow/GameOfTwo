import { describe, expect, it } from 'vitest';
import { applyMove, getResult, setup } from './logic';

describe('井字遊戲', () => {
  it('判定連線獲勝', () => {
    let s = setup(['a', 'b'], () => 0);
    const [x, o] = s.players;
    for (const [who, cell] of [[x, 0], [o, 4], [x, 1], [o, 8], [x, 2]] as const) s = applyMove(s, who, { cell });
    expect(s.winner).toBe(0);
    expect(s.winLine).toEqual([0, 1, 2]);
    expect(getResult(s, {})!.points).toEqual({ [x]: 1 });
  });

  it('判定平手', () => {
    let s = setup(['a', 'b'], () => 0);
    const [x, o] = s.players;
    // x o x / x o o / o x x
    const moves = [[x, 0], [o, 1], [x, 2], [o, 4], [x, 3], [o, 5], [x, 7], [o, 6], [x, 8]] as const;
    for (const [who, cell] of moves) s = applyMove(s, who, { cell });
    expect(s.draw).toBe(true);
    expect(getResult(s, {})!.points).toEqual({});
  });

  it('不能下在已經有棋子的格子或搶先下', () => {
    const s = setup(['a', 'b'], () => 0);
    const [x, o] = s.players;
    expect(() => applyMove(s, o, { cell: 0 })).toThrow('還沒輪到你');
    const s2 = applyMove(s, x, { cell: 0 });
    expect(() => applyMove(s2, o, { cell: 0 })).toThrow('不能下');
  });
});
