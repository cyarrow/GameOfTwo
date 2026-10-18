import { describe, expect, it } from 'vitest';
import { applyMove, currentPlayer, getResult, setup } from './logic';

describe('終極密碼', () => {
  it('依序縮小範圍，猜中炸彈的人輸', () => {
    let s = { ...setup(['a', 'b', 'c'], Math.random), bomb: 42 };
    const order = s.order;
    s = applyMove(s, order[0], { value: 50 });
    expect([s.low, s.high]).toEqual([0, 50]);
    s = applyMove(s, order[1], { value: 10 });
    expect([s.low, s.high]).toEqual([10, 50]);
    expect(getResult(s, {})).toBeNull();
    s = applyMove(s, order[2], { value: 42 });
    expect(s.loser).toBe(order[2]);
    const result = getResult(s, { [order[2]]: '小明' })!;
    expect(result.points).toEqual({ [order[0]]: 1, [order[1]]: 1, [order[2]]: 0 });
    expect(result.message).toContain('小明');
  });

  it('拒絕不合法的動作', () => {
    const s = { ...setup(['a', 'b'], Math.random), bomb: 42 };
    const other = s.order[1];
    expect(() => applyMove(s, other, { value: 5 })).toThrow('還沒輪到你');
    expect(() => applyMove(s, currentPlayer(s), { value: 0 })).toThrow('1 ~ 100');
    expect(() => applyMove(s, currentPlayer(s), { value: 101 })).toThrow();
    expect(() => applyMove(s, currentPlayer(s), { value: 3.5 })).toThrow();
  });

  it('炸彈落在 1～100', () => {
    expect(setup(['a', 'b'], () => 0).bomb).toBe(1);
    expect(setup(['a', 'b'], () => 0.9999).bomb).toBe(100);
  });
});
