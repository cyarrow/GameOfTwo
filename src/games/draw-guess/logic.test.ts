import { describe, expect, it } from 'vitest';
import { applyMove, drawerOf, getResult, setup, type DrawGuessState } from './logic';

const stroke = { c: 0, w: 6, p: [10, 10, 200, 200] };

function withWord(s: DrawGuessState, word: string): DrawGuessState {
  return { ...s, words: s.words.map((w, i) => (i === s.round ? word : w)) };
}

describe('你畫我猜', () => {
  it('2 人時每人畫兩題', () => {
    const s = setup(['a', 'b'], Math.random);
    expect(s.drawers).toHaveLength(4);
    expect(setup(['a', 'b', 'c'], Math.random).drawers).toHaveLength(3);
  });

  it('只有畫的人能畫，畫的人不能猜', () => {
    const s = setup(['a', 'b', 'c'], Math.random);
    const drawer = drawerOf(s);
    const guesser = s.players.find((id) => id !== drawer)!;
    expect(() => applyMove(s, guesser, { type: 'stroke', round: 0, stroke })).toThrow('只有畫畫的人');
    expect(() => applyMove(s, drawer, { type: 'guess', round: 0, text: 'x' })).toThrow('不能猜');
    const s2 = applyMove(s, drawer, { type: 'stroke', round: 0, stroke });
    expect(s2.strokes).toHaveLength(1);
    expect(applyMove(s2, drawer, { type: 'clear', round: 0 }).strokes).toHaveLength(0);
    expect(() => applyMove(s, drawer, { type: 'stroke', round: 0, stroke: { c: 0, w: 6, p: [1, 2, 3] } })).toThrow('筆畫');
    expect(() => applyMove(s, drawer, { type: 'stroke', round: 0, stroke: { c: 99, w: 6, p: [1, 2] } })).toThrow('筆畫');
  });

  it('猜對計分：第一個 2 分、之後 1 分，畫的人每人 1 分；全員猜對就公布', () => {
    let s = withWord(setup(['a', 'b', 'c'], Math.random), '珍珠奶茶');
    const drawer = drawerOf(s);
    const [g1, g2] = s.players.filter((id) => id !== drawer);
    s = applyMove(s, g1, { type: 'guess', round: 0, text: '奶茶' });
    expect(s.guesses[0].correct).toBe(false);
    s = applyMove(s, g1, { type: 'guess', round: 0, text: ' 珍珠 奶茶 ' });
    expect(() => applyMove(s, g1, { type: 'guess', round: 0, text: '珍珠奶茶' })).toThrow('已經猜對');
    expect(s.revealed).toBe(false);
    s = applyMove(s, g2, { type: 'guess', round: 0, text: '珍珠奶茶' });
    expect(s.revealed).toBe(true);
    expect(s.scores).toEqual({ [g1]: 2, [g2]: 1, [drawer]: 2 });
    expect(() => applyMove(s, g2, { type: 'guess', round: 0, text: 'x' })).toThrow('已經結束');
  });

  it('跳過、下一題，最後一題結束後算結果', () => {
    let s = setup(['a', 'b'], Math.random);
    for (let r = 0; r < s.drawers.length; r++) {
      s = applyMove(s, drawerOf(s), { type: 'skip', round: r });
      if (r < s.drawers.length - 1) {
        expect(getResult(s, {})).toBeNull();
        s = applyMove(s, s.players[0], { type: 'next', round: r });
        expect(s.strokes).toEqual([]);
      }
    }
    expect(getResult(s, {})!.message).toContain('沒有人猜對');
  });
});
