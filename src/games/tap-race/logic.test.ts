import { describe, expect, it } from 'vitest';
import { applyMove, getResult, MAX_TAPS, setup } from './logic';

describe('連打大賽', () => {
  it('全員準備才開始，結束後最多下的人贏', () => {
    let s = setup(['a', 'b']);
    s = applyMove(s, 'a', { type: 'ready' });
    expect(s.started).toBe(false);
    expect(() => applyMove(s, 'a', { type: 'progress', count: 3 })).toThrow('還沒開始');
    s = applyMove(s, 'b', { type: 'ready' });
    expect(s.started).toBe(true);
    s = applyMove(s, 'a', { type: 'progress', count: 30 });
    s = applyMove(s, 'a', { type: 'progress', count: 20 }); // 晚到的舊進度不會讓次數變少
    expect(s.counts.a).toBe(30);
    s = applyMove(s, 'a', { type: 'final', count: 50 });
    expect(getResult(s, {})).toBeNull();
    s = applyMove(s, 'b', { type: 'final', count: 40 });
    expect(getResult(s, { a: '小明' })).toEqual({ points: { a: 1 }, message: '👆 小明 以 50 下獲勝！' });
  });

  it('完成後不能再改，次數有上限', () => {
    let s = setup(['a', 'b']);
    s = applyMove(applyMove(s, 'a', { type: 'ready' }), 'b', { type: 'ready' });
    expect(() => applyMove(s, 'a', { type: 'final', count: MAX_TAPS + 1 })).toThrow();
    s = applyMove(s, 'a', { type: 'final', count: 10 });
    s = applyMove(s, 'a', { type: 'progress', count: 99 });
    expect(s.counts.a).toBe(10);
  });
});
