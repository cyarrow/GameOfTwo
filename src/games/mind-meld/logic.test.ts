import { describe, expect, it } from 'vitest';
import { applyMove, getResult, ROUNDS, setup } from './logic';
import { QUESTIONS } from './questions';

describe('默契大考驗', () => {
  it('抽出不重複的題目', () => {
    const s = setup(['a', 'b'], Math.random);
    expect(new Set(s.questions).size).toBe(ROUNDS);
    expect(s.questions.every((q) => q >= 0 && q < QUESTIONS.length)).toBe(true);
  });

  it('全員作答才公布，跟幾個人一樣就得幾分', () => {
    let s = setup(['a', 'b', 'c'], Math.random);
    s = applyMove(s, 'a', { type: 'answer', round: 0, option: 1 });
    s = applyMove(s, 'b', { type: 'answer', round: 0, option: 2 });
    s = applyMove(s, 'b', { type: 'answer', round: 0, option: 1 }); // 公布前可以改答案
    expect(s.revealed).toBe(false);
    expect(() => applyMove(s, 'a', { type: 'next', round: 0 })).toThrow('還有人沒作答');
    s = applyMove(s, 'c', { type: 'answer', round: 0, option: 3 });
    expect(s.revealed).toBe(true);
    expect(s.scores).toEqual({ a: 1, b: 1, c: 0 });
    expect(() => applyMove(s, 'c', { type: 'answer', round: 0, option: 1 })).toThrow('公布');
  });

  it('下一題只會前進一次，最後一題公布後結束', () => {
    let s = setup(['a', 'b'], Math.random);
    for (let r = 0; r < ROUNDS; r++) {
      s = applyMove(s, 'a', { type: 'answer', round: r, option: 0 });
      s = applyMove(s, 'b', { type: 'answer', round: r, option: r === 0 ? 1 : 0 });
      if (r < ROUNDS - 1) {
        expect(getResult(s, {})).toBeNull();
        s = applyMove(s, 'a', { type: 'next', round: r });
        expect(() => applyMove(s, 'b', { type: 'next', round: r })).toThrow('題目已經換了');
      }
    }
    expect(s.scores).toEqual({ a: ROUNDS - 1, b: ROUNDS - 1 });
    expect(getResult(s, {})!.points).toEqual({ a: 1, b: 1 });
  });
});
