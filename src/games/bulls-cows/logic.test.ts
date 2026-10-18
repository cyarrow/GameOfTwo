import { describe, expect, it } from 'vitest';
import { applyMove, getResult, isValidGuess, score, setup } from './logic';

describe('1A2B 猜數字', () => {
  it('密碼是 4 個不重複數字', () => {
    for (let i = 0; i < 20; i++) expect(isValidGuess(setup(['a', 'b'], Math.random).secret)).toBe(true);
  });

  it('計算 A 和 B', () => {
    expect(score('1234', '1243')).toEqual({ a: 2, b: 2 });
    expect(score('1234', '5678')).toEqual({ a: 0, b: 0 });
    expect(score('1234', '1234')).toEqual({ a: 4, b: 0 });
    expect(score('0987', '7890')).toEqual({ a: 0, b: 4 });
  });

  it('輪流猜，猜中就贏', () => {
    let s = { ...setup(['a', 'b'], Math.random), secret: '1234' };
    const [p1, p2] = s.order;
    expect(() => applyMove(s, p1, { guess: '1123' })).toThrow('不重複');
    expect(() => applyMove(s, p2, { guess: '5678' })).toThrow('還沒輪到你');
    s = applyMove(s, p1, { guess: '5678' });
    s = applyMove(s, p2, { guess: '1234' });
    expect(s.winner).toBe(p2);
    expect(getResult(s, {})!.points).toEqual({ [p2]: 1 });
  });
});
