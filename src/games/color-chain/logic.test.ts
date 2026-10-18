import { describe, expect, it } from 'vitest';
import { applyMove, canPlay, DECK, getResult, HAND_SIZE, setup, type ColorChainState } from './logic';

const find = (color: string | null, value: string, skip = 0) =>
  DECK.map((c, i) => [c, i] as const).filter(([c]) => c.color === color && c.value === value)[skip][1];

/** 固定手牌與桌面，方便測試 */
function fixed(order: string[], hands: Record<string, number[]>, top: number): ColorChainState {
  const used = new Set([...Object.values(hands).flat(), top]);
  return {
    ...setup(order, () => 0.5),
    order,
    turn: 0,
    hands,
    discard: [top],
    drawPile: DECK.map((_, i) => i).filter((i) => !used.has(i)),
    color: DECK[top].color!,
  };
}

describe('顏色接龍', () => {
  it('牌組 108 張、發 7 張、第一張是數字牌', () => {
    expect(DECK).toHaveLength(108);
    const s = setup(['a', 'b', 'c'], Math.random);
    expect(Object.values(s.hands).every((h) => h.length === HAND_SIZE)).toBe(true);
    expect(DECK[s.discard[0]].value).toMatch(/^\d$/);
    expect(s.drawPile.length + 3 * HAND_SIZE + 1).toBe(108);
  });

  it('同色或同數字才能出，萬用牌要指定顏色', () => {
    const s = fixed(['a', 'b'], { a: [find('r', '3'), find('b', '5'), find('g', '7'), find(null, 'wild')], b: [find('y', '1')] }, find('r', '5'));
    expect(canPlay(s, find('r', '3'))).toBe(true);
    expect(canPlay(s, find('b', '5'))).toBe(true);
    expect(canPlay(s, find('g', '7'))).toBe(false);
    expect(() => applyMove(s, 'a', { type: 'play', card: find('g', '7') })).toThrow('不能出');
    expect(() => applyMove(s, 'a', { type: 'play', card: find(null, 'wild') })).toThrow('選擇顏色');
    const s2 = applyMove(s, 'a', { type: 'play', card: find(null, 'wild'), color: 'g' });
    expect(s2.color).toBe('g');
    expect(s2.turn).toBe(1);
  });

  it('+2 讓下一位抽兩張並跳過；3 人時迴轉會改變順序', () => {
    let s = fixed(['a', 'b', 'c'], { a: [find('r', 'draw2'), find('r', '1')], b: [find('y', '1')], c: [find('g', '1')] }, find('r', '5'));
    s = applyMove(s, 'a', { type: 'play', card: find('r', 'draw2') });
    expect(s.hands.b).toHaveLength(3);
    expect(s.order[s.turn]).toBe('c');

    let r = fixed(['a', 'b', 'c'], { a: [find('r', 'reverse'), find('r', '1')], b: [find('y', '1')], c: [find('g', '1')] }, find('r', '5'));
    r = applyMove(r, 'a', { type: 'play', card: find('r', 'reverse') });
    expect(r.direction).toBe(-1);
    expect(r.order[r.turn]).toBe('c');
  });

  it('2 人時迴轉等於跳過', () => {
    let s = fixed(['a', 'b'], { a: [find('r', 'reverse'), find('r', '1')], b: [find('y', '1')] }, find('r', '5'));
    s = applyMove(s, 'a', { type: 'play', card: find('r', 'reverse') });
    expect(s.order[s.turn]).toBe('a');
  });

  it('抽牌：不能出就自動換人；能出可以出或跳過', () => {
    const s = fixed(['a', 'b'], { a: [find('g', '7')], b: [find('y', '1')] }, find('r', '5'));
    // 讓牌堆最上面是不能出的牌
    const noPlay = { ...s, drawPile: [find('g', '8'), ...s.drawPile.filter((c) => c !== find('g', '8'))] };
    const after = applyMove(noPlay, 'a', { type: 'draw' });
    expect(after.turn).toBe(1);
    expect(after.drawn).toBeNull();

    const canPlayTop = { ...s, drawPile: [find('r', '9'), ...s.drawPile.filter((c) => c !== find('r', '9'))] };
    const drew = applyMove(canPlayTop, 'a', { type: 'draw' });
    expect(drew.drawn).toBe(find('r', '9'));
    expect(() => applyMove(drew, 'a', { type: 'draw' })).toThrow('抽過');
    expect(applyMove(drew, 'a', { type: 'pass' }).turn).toBe(1);
  });

  it('牌堆抽完會把棄牌堆洗回來', () => {
    const s = fixed(['a', 'b'], { a: [find('g', '7')], b: [find('y', '1')] }, find('r', '5'));
    const empty = { ...s, drawPile: [], discard: [find('r', '1'), find('r', '2'), find('r', '5')] };
    const after = applyMove(empty, 'a', { type: 'draw' });
    expect(after.hands.a).toHaveLength(2);
    expect(after.discard).toEqual([find('r', '5')]);
  });

  it('出完手牌就贏', () => {
    let s = fixed(['a', 'b'], { a: [find('r', '3')], b: [find('y', '1')] }, find('r', '5'));
    s = applyMove(s, 'a', { type: 'play', card: find('r', '3') });
    expect(getResult(s, {})!.points).toEqual({ a: 1 });
  });
});
