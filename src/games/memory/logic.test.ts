import { describe, expect, it } from 'vitest';
import { applyMove, getResult, PAIRS, setup, type MemoryState } from './logic';

function pairOf(s: MemoryState, i: number): number {
  return s.cards.findIndex((c, j) => j !== i && c === s.cards[i]);
}

describe('記憶翻牌', () => {
  it('產生剛好成對的牌', () => {
    const s = setup(['a', 'b'], Math.random);
    expect(s.cards).toHaveLength(PAIRS * 2);
    for (let i = 0; i < s.cards.length; i++) expect(pairOf(s, i)).toBeGreaterThanOrEqual(0);
  });

  it('配對成功繼續翻，失敗換人且牌保留到下一次翻牌', () => {
    let s = setup(['a', 'b'], Math.random);
    const [p1, p2] = s.order;
    s = applyMove(s, p1, { card: 0 });
    expect(() => applyMove(s, p1, { card: 0 })).toThrow('已經翻開');
    s = applyMove(s, p1, { card: pairOf(s, 0) });
    expect(s.pairs[p1]).toBe(1);
    expect(s.turn).toBe(0);

    const a = s.matchedBy.findIndex((m) => m === null);
    const b = s.cards.findIndex((c, j) => s.matchedBy[j] === null && c !== s.cards[a]);
    s = applyMove(applyMove(s, p1, { card: a }), p1, { card: b });
    expect(s.flipped).toEqual([a, b]);
    expect(s.order[s.turn]).toBe(p2);
    s = applyMove(s, p2, { card: a }); // 可以翻剛剛蓋回去的牌
    expect(s.flipped).toEqual([a]);
  });

  it('全部配對完後最多對的人贏', () => {
    let s = setup(['a', 'b'], Math.random);
    const p1 = s.order[0];
    while (s.matchedBy.some((m) => m === null)) {
      const i = s.matchedBy.findIndex((m) => m === null);
      s = applyMove(applyMove(s, p1, { card: i }), p1, { card: pairOf(s, i) });
    }
    expect(getResult(s, {})!.points).toEqual({ [p1]: 1 });
  });
});
