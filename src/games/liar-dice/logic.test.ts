import { describe, expect, it } from 'vitest';
import { applyMove, countFace, getResult, isValidBid, nextMinBid, setup, type LiarDiceState } from './logic';

function fixed(): LiarDiceState {
  return {
    ...setup(['a', 'b'], () => 0.5),
    order: ['a', 'b'],
    dice: { a: [1, 2, 3, 5, 5], b: [2, 5, 6, 6, 6] },
  };
}

describe('吹牛骰子', () => {
  it('1 是萬用骰', () => {
    expect(countFace(fixed(), 5)).toBe(4);
    expect(countFace(fixed(), 6)).toBe(4);
  });

  it('喊的規則：第一口至少玩家人數個、之後要更大、不能喊 1', () => {
    const s = fixed();
    expect(isValidBid(s, 1, 3)).toBe(false);
    expect(isValidBid(s, 2, 3)).toBe(true);
    expect(isValidBid(s, 3, 1)).toBe(false);
    expect(isValidBid(s, 11, 3)).toBe(false);
    const s2 = applyMove(s, 'a', { type: 'bid', quantity: 3, face: 4 });
    expect(isValidBid(s2, 3, 4)).toBe(false);
    expect(isValidBid(s2, 3, 5)).toBe(true);
    expect(isValidBid(s2, 4, 2)).toBe(true);
    expect(nextMinBid(s2)).toEqual({ quantity: 3, face: 5 });
    expect(() => applyMove(s2, 'b', { type: 'bid', quantity: 2, face: 6 })).toThrow('喊得比上一口大');
  });

  it('開：數量足夠時開的人輸', () => {
    let s = applyMove(fixed(), 'a', { type: 'bid', quantity: 4, face: 5 });
    s = applyMove(s, 'b', { type: 'challenge' });
    expect(s.reveal).toEqual({ by: 'b', count: 4, loser: 'b' });
    expect(getResult(s, {})!.points).toEqual({ a: 1, b: 0 });
  });

  it('開：數量不足時喊的人輸', () => {
    let s = applyMove(fixed(), 'a', { type: 'bid', quantity: 5, face: 5 });
    s = applyMove(s, 'b', { type: 'challenge' });
    expect(s.reveal!.loser).toBe('a');
  });

  it('沒人喊之前不能開，也不能搶著喊', () => {
    const s = fixed();
    expect(() => applyMove(s, 'a', { type: 'challenge' })).toThrow('還沒有人喊');
    expect(() => applyMove(s, 'b', { type: 'bid', quantity: 2, face: 2 })).toThrow('還沒輪到你');
  });
});
