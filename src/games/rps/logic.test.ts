import { describe, expect, it } from 'vitest';
import { applyMove, getResult, roundWinners, setup, TARGET_WINS } from './logic';

describe('剪刀石頭布', () => {
  it('多人勝負判定', () => {
    expect(roundWinners({ a: 'rock', b: 'scissors', c: 'rock' })).toEqual(['a', 'c']);
    expect(roundWinners({ a: 'rock', b: 'paper' })).toEqual(['b']);
    expect(roundWinners({ a: 'rock', b: 'paper', c: 'scissors' })).toEqual([]);
    expect(roundWinners({ a: 'rock', b: 'rock' })).toEqual([]);
  });

  it('全員出完才結算，先拿到目標勝場的人贏', () => {
    let s = setup(['a', 'b']);
    s = applyMove(s, 'a', { round: 1, choice: 'rock' });
    expect(() => applyMove(s, 'a', { round: 1, choice: 'paper' })).toThrow('已經出過');
    for (let r = 1; r <= TARGET_WINS; r++) {
      if (r > 1) s = applyMove(s, 'a', { round: r, choice: 'rock' });
      s = applyMove(s, 'b', { round: r, choice: 'scissors' });
    }
    expect(s.wins).toEqual({ a: TARGET_WINS, b: 0 });
    expect(getResult(s, {})!.points).toEqual({ a: 1 });
    expect(() => applyMove(s, 'a', { round: s.round, choice: 'rock' })).toThrow('結束');
  });

  it('舊一輪的點擊會被拒絕', () => {
    let s = setup(['a', 'b']);
    s = applyMove(applyMove(s, 'a', { round: 1, choice: 'rock' }), 'b', { round: 1, choice: 'rock' });
    expect(() => applyMove(s, 'a', { round: 1, choice: 'paper' })).toThrow('這一輪已經結束');
  });
});
