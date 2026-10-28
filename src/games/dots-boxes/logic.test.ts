import { describe, expect, it } from 'vitest';
import { shortNames } from '../helpers';
import { applyMove, boxCounts, getResult, setup, SIZE, type DotsBoxesState } from './logic';

function draw(s: DotsBoxesState, line: string): DotsBoxesState {
  return applyMove(s, s.order[s.turn], { line });
}

function allLines(): string[] {
  const lines: string[] = [];
  for (let r = 0; r <= SIZE; r++) for (let c = 0; c < SIZE; c++) lines.push(`h-${r}-${c}`);
  for (let r = 0; r < SIZE; r++) for (let c = 0; c <= SIZE; c++) lines.push(`v-${r}-${c}`);
  return lines;
}

describe('點格棋', () => {
  it('畫第四條邊佔領格子並再畫一次', () => {
    let s = setup(['a', 'b', 'c'], () => 0);
    s = draw(s, 'h-0-0');
    s = draw(s, 'h-1-0');
    s = draw(s, 'v-0-0');
    const scorer = s.order[s.turn];
    s = draw(s, 'v-0-1');
    expect(s.boxes['0-0']).toBe(scorer);
    expect(s.order[s.turn]).toBe(scorer);
  });

  it('一條線可以同時完成兩格', () => {
    let s = setup(['a', 'b'], () => 0);
    for (const l of ['h-0-0', 'h-1-0', 'v-0-0', 'h-0-1', 'h-1-1', 'v-0-2']) s = draw(s, l);
    const scorer = s.order[s.turn];
    s = draw(s, 'v-0-1');
    expect(boxCounts(s)[scorer]).toBe(2);
  });

  it('拒絕重複或不存在的線', () => {
    let s = setup(['a', 'b'], () => 0);
    s = draw(s, 'h-0-0');
    expect(() => draw(s, 'h-0-0')).toThrow('已經有人畫');
    expect(() => draw(s, `h-0-${SIZE}`)).toThrow('沒有這條線');
    expect(() => draw(s, 'x-0-0')).toThrow('沒有這條線');
  });

  it('全部畫完後結束', () => {
    let s = setup(['a', 'b'], () => 0);
    for (const l of allLines()) s = draw(s, l);
    expect(Object.keys(s.boxes)).toHaveLength(SIZE * SIZE);
    expect(getResult(s, {})).not.toBeNull();
  });

  it('格子上的名字縮寫不會重複', () => {
    expect(shortNames(['a', 'b', 'c'], { a: '小明', b: '小華', c: '阿美' })).toEqual({ a: '小明', b: '小華', c: '阿' });
    expect(shortNames(['a', 'b'], { a: 'YY', b: 'YYZ' })).toEqual({ a: 'YY', b: 'YYZ' });
  });
});
