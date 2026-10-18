import { describe, expect, it } from 'vitest';
import { applyMove, bullheads, cheapestRow, getResult, HAND_SIZE, setup, targetRow, type TakeSixState } from './logic';

function base(): TakeSixState {
  return {
    ...setup(['a', 'b'], Math.random),
    hands: { a: [3, 30, 41, 60], b: [9, 31, 42, 61] },
    rows: [[10], [20, 21, 22, 23, 24], [40], [50]],
  };
}

describe('誰是牛頭王', () => {
  it('牛頭數', () => {
    expect([bullheads(1), bullheads(5), bullheads(10), bullheads(11), bullheads(55)]).toEqual([1, 2, 3, 5, 7]);
  });

  it('發牌與起始排', () => {
    const s = setup(['a', 'b', 'c'], Math.random);
    expect(Object.values(s.hands).every((h) => h.length === HAND_SIZE)).toBe(true);
    expect(s.rows.map((r) => r.length)).toEqual([1, 1, 1, 1]);
    const all = [...Object.values(s.hands).flat(), ...s.rows.flat()];
    expect(new Set(all).size).toBe(all.length);
  });

  it('放牌位置：結尾比它小且最接近的那排', () => {
    const rows = [[10], [20], [40], [50]];
    expect(targetRow(rows, 45)).toBe(2);
    expect(targetRow(rows, 15)).toBe(0);
    expect(targetRow(rows, 5)).toBe(-1);
    expect(cheapestRow([[10, 11], [20], [55], [30]])).toBe(1);
  });

  it('全員出牌後由小到大結算，第 6 張要收走整排', () => {
    let s = applyMove(base(), 'a', { turn: 1, card: 30 });
    expect(s.rows[1]).toHaveLength(5);
    expect(() => applyMove(s, 'a', { turn: 1, card: 41 })).toThrow('已經出過');
    s = applyMove(s, 'b', { turn: 1, card: 31 });
    // 30 放到第 2 排成為第 6 張 → a 收走 20~24（3+1+5+1+1 = 11 個牛頭）；31 接在 30 後面
    expect(s.penalties).toEqual({ a: 11, b: 0 });
    expect(s.rows[1]).toEqual([30, 31]);
    expect(s.hands.a).toEqual([3, 41, 60]);
    expect(s.turn).toBe(2);
    expect(s.lastPlacements.map((p) => [p.by, p.card, p.took.length])).toEqual([['a', 30, 5], ['b', 31, 0]]);
  });

  it('牌太小時收走牛頭最少的一排', () => {
    let s = applyMove(base(), 'a', { turn: 1, card: 3 });
    s = applyMove(s, 'b', { turn: 1, card: 9 });
    // 3 太小 → 收走牛頭最少的第 1 排 [10]（3 個牛頭），變成 [3]；9 接在 3 後面
    expect(s.penalties.a).toBe(3);
    expect(s.rows[0]).toEqual([3, 9]);
  });

  it('不能出手上沒有的牌；打完後牛頭最少的人贏', () => {
    let s = setup(['a', 'b'], Math.random);
    expect(() => applyMove(s, 'a', { turn: 1, card: 999 })).toThrow('沒有這張牌');
    for (let t = 1; t <= HAND_SIZE; t++) {
      s = applyMove(s, 'a', { turn: t, card: s.hands.a[0] });
      s = applyMove(s, 'b', { turn: t, card: s.hands.b[0] });
    }
    const result = getResult(s, {})!;
    const least = Math.min(s.penalties.a, s.penalties.b);
    expect(Object.keys(result.points).every((id) => s.penalties[id] === least)).toBe(true);
  });
});
