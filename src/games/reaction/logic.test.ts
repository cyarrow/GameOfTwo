import { describe, expect, it } from 'vitest';
import { applyMove, FALSE_START, getResult, ROUNDS, roundWinners, setup } from './logic';

describe('反應力對決', () => {
  it('最快的人贏這輪，太早按不算', () => {
    expect(roundWinners({ a: 250, b: 200, c: FALSE_START })).toEqual(['b']);
    expect(roundWinners({ a: FALSE_START, b: FALSE_START })).toEqual([]);
    expect(roundWinners({ a: 200, b: 200 })).toEqual(['a', 'b']);
  });

  it('全員按完才進下一輪，打完全部輪數後結算', () => {
    let s = setup(['a', 'b'], Math.random);
    s = applyMove(s, 'a', { round: 0, ms: 300 });
    expect(s.round).toBe(0);
    expect(() => applyMove(s, 'a', { round: 0, ms: 100 })).toThrow('已經按過');
    expect(() => applyMove(s, 'b', { round: 0, ms: 99999 })).toThrow('時間不正確');
    s = applyMove(s, 'b', { round: 0, ms: FALSE_START });
    expect(s.round).toBe(1);
    expect(s.wins).toEqual({ a: 1, b: 0 });
    expect(() => applyMove(s, 'a', { round: 0, ms: 100 })).toThrow('這一輪已經結束');
    for (let r = 1; r < ROUNDS; r++) {
      s = applyMove(s, 'a', { round: r, ms: 400 });
      s = applyMove(s, 'b', { round: r, ms: 300 });
    }
    expect(getResult(s, {})!.points).toEqual({ b: 1 });
  });
});
