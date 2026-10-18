import { describe, expect, it } from 'vitest';
import { applyMove, getResult, placeFleet, setup, SHIPS, SIZE } from './logic';

describe('海戰棋', () => {
  it('艦隊不重疊、不超出邊界', () => {
    for (let i = 0; i < 50; i++) {
      const fleet = placeFleet(Math.random);
      const cells = fleet.flat();
      expect(fleet.map((s) => s.length)).toEqual(SHIPS);
      expect(new Set(cells).size).toBe(cells.length);
      for (const ship of fleet) {
        const rows = new Set(ship.map((c) => Math.floor(c / SIZE)));
        const cols = new Set(ship.map((c) => c % SIZE));
        expect(rows.size === 1 || cols.size === 1).toBe(true);
        expect(cells.every((c) => c >= 0 && c < SIZE * SIZE)).toBe(true);
      }
    }
  });

  it('重新擺放會改變艦隊，準備後不能再改', () => {
    let s = setup(['a', 'b'], Math.random);
    const [p1, p2] = s.players;
    const before = JSON.stringify(s.fleets[p1]);
    let changed = false;
    for (let i = 0; i < 5 && !changed; i++) {
      s = applyMove(s, p1, { type: 'shuffle' });
      changed = JSON.stringify(s.fleets[p1]) !== before;
    }
    expect(changed).toBe(true);
    expect(() => applyMove(s, p1, { type: 'fire', cell: 0 })).toThrow('還有人在擺船');
    s = applyMove(applyMove(s, p1, { type: 'ready' }), p2, { type: 'ready' });
    expect(() => applyMove(s, p1, { type: 'shuffle' })).toThrow('已經準備好');
  });

  it('輪流開砲，擊沉全部就贏', () => {
    let s = setup(['a', 'b'], Math.random);
    const [p1, p2] = s.players;
    s = applyMove(applyMove(s, p1, { type: 'ready' }), p2, { type: 'ready' });
    const targets = s.fleets[p2].flat();
    const misses = Array.from({ length: SIZE * SIZE }, (_, i) => i).filter((i) => !s.fleets[p1].flat().includes(i));
    targets.forEach((cell, i) => {
      s = applyMove(s, p1, { type: 'fire', cell });
      if (i < targets.length - 1) s = applyMove(s, p2, { type: 'fire', cell: misses[i] });
    });
    expect(s.winner).toBe(p1);
    expect(s.lastShot).toMatchObject({ hit: true, sunk: true });
    expect(getResult(s, {})!.points).toEqual({ [p1]: 1 });
  });
});
