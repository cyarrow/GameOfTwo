import { describe, expect, it } from 'vitest';
import { parseContent, pickMixed, pickOne, validateItem } from './banks';

describe('自訂題庫', () => {
  it('驗證題目格式', () => {
    expect(validateItem('mind-meld', { q: '早餐吃什麼？', options: ['蛋餅', '飯糰', '吐司', '不吃'] })).toBeNull();
    expect(validateItem('mind-meld', { q: '早餐吃什麼？', options: ['蛋餅', '飯糰', '吐司'] })).toContain('4 個選項');
    expect(validateItem('mind-meld', { q: '早餐？', options: ['蛋餅', '蛋餅', '吐司', '不吃'] })).toContain('重複');
    expect(validateItem('draw-guess', { word: '   ' })).not.toBeNull();
    expect(validateItem('draw-guess', { word: '皮卡丘' })).toBeNull();
    expect(validateItem('undercover', { a: '奶茶', b: '珍珠奶茶' })).toContain('包含');
    expect(validateItem('undercover', { a: '可樂', b: '雪碧' })).toBeNull();
    expect(validateItem('punishments', { text: 'x'.repeat(41) })).not.toBeNull();
  });

  it('整理資料庫內容，略過格式不對的題目', () => {
    const content = parseContent({
      'mind-meld': { x: { q: ' 題目 ', options: ['a', 'b', 'c', 'd'], by: '小明', at: 1 }, bad: { q: 'x' } },
      'draw-guess': { y: { word: ' 皮卡丘 ', by: '小明', at: 1 }, bad: { word: 123 } },
      undercover: { z: { a: '可樂', b: '雪碧', by: '小明', at: 1 } },
      punishments: 'not-an-object',
    });
    expect(content).toEqual({
      mindMeld: [{ q: '題目', options: ['a', 'b', 'c', 'd'] }],
      drawGuess: ['皮卡丘'],
      undercover: [['可樂', '雪碧']],
      punishments: [],
    });
    expect(parseContent(null)).toEqual({ mindMeld: [], drawGuess: [], undercover: [], punishments: [] });
  });

  it('自訂題目優先但最多一半，不重複', () => {
    // 內建題目裡也有「自1」，用來確認同一題不會被抽兩次
    for (let i = 0; i < 20; i++) {
      const picked = pickMixed(['自1', '自2', '自3', '自4'], ['內1', '內2', '內3', '內4', '自1'], 4, Math.random);
      expect(picked).toHaveLength(4);
      expect(new Set(picked).size).toBe(4);
      expect(picked.filter((w) => w.startsWith('內')).length).toBeGreaterThanOrEqual(1);
      expect(picked.filter((w) => w.startsWith('自')).length).toBeGreaterThanOrEqual(2);
    }
    expect(pickMixed([], ['a', 'b', 'c'], 2, Math.random)).toHaveLength(2);
    expect(pickMixed(['x'], ['a', 'b', 'c'], 3, Math.random)).toContain('x');
  });

  it('沒有自訂題目時只從內建抽', () => {
    for (let i = 0; i < 10; i++) expect(['a', 'b']).toContain(pickOne([], ['a', 'b'], Math.random));
    expect(pickOne(['自訂'], ['a'], () => 0)).toBe('自訂');
  });
});
