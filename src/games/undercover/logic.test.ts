import { describe, expect, it } from 'vitest';
import { applyMove, getResult, setup, wordOf, type UndercoverState } from './logic';

function fixed(): UndercoverState {
  return { ...setup(['a', 'b', 'c', 'd'], Math.random), order: ['a', 'b', 'c', 'd'], alive: ['a', 'b', 'c', 'd'], spy: 'd', words: ['可樂', '雪碧'] };
}

function describeAll(s: UndercoverState): UndercoverState {
  for (const id of s.alive) s = applyMove(s, id, { type: 'describe', round: s.round, text: `${id} 的描述` });
  return s;
}

describe('誰是臥底', () => {
  it('臥底拿到不同的詞', () => {
    const s = fixed();
    expect(wordOf(s, 'a')).toBe('可樂');
    expect(wordOf(s, 'd')).toBe('雪碧');
  });

  it('依序描述，不能說出自己的詞', () => {
    let s = fixed();
    expect(() => applyMove(s, 'b', { type: 'describe', round: 1, text: 'hi' })).toThrow('還沒輪到你');
    expect(() => applyMove(s, 'a', { type: 'describe', round: 1, text: '好喝的可樂' })).toThrow('不能直接說出');
    s = describeAll(s);
    expect(s.phase).toBe('vote');
  });

  it('投出臥底，平民全體得分', () => {
    let s = describeAll(fixed());
    expect(() => applyMove(s, 'a', { type: 'vote', round: 1, target: 'a' })).toThrow('不能投給');
    for (const [v, t] of [['a', 'd'], ['b', 'd'], ['c', 'd'], ['d', 'a']]) s = applyMove(s, v, { type: 'vote', round: 1, target: t });
    expect(s.winner).toBe('civilians');
    expect(getResult(s, {})!.points).toEqual({ a: 1, b: 1, c: 1 });
  });

  it('平票沒人淘汰；淘汰平民到剩 2 人時臥底贏', () => {
    let s = describeAll(fixed());
    for (const [v, t] of [['a', 'b'], ['b', 'a'], ['c', 'd'], ['d', 'c']]) s = applyMove(s, v, { type: 'vote', round: 1, target: t });
    expect(s.voteLog[0].out).toBeNull();
    expect(s.round).toBe(2);
    expect(s.alive).toHaveLength(4);

    s = describeAll(s);
    for (const [v, t] of [['a', 'b'], ['b', 'a'], ['c', 'b'], ['d', 'b']]) s = applyMove(s, v, { type: 'vote', round: 2, target: t });
    expect(s.alive).toEqual(['a', 'c', 'd']);
    expect(s.winner).toBeNull();
    expect(() => applyMove(s, 'b', { type: 'describe', round: 3, text: 'x' })).toThrow('淘汰');

    s = describeAll(s);
    for (const [v, t] of [['a', 'c'], ['c', 'a'], ['d', 'c']]) s = applyMove(s, v, { type: 'vote', round: 3, target: t });
    expect(s.winner).toBe('spy');
    expect(getResult(s, {})!.points).toEqual({ d: 1 });
  });
});
