import { describe, expect, it } from 'vitest';
import { applyMove, counts, getResult, legalMoves, setup, SIZE, type OthelloState } from './logic';

const at = (r: number, c: number) => r * SIZE + c;

describe('黑白棋', () => {
  it('開局有 4 個合法位置，下棋會翻轉', () => {
    const s = setup(['a', 'b'], () => 0);
    expect(legalMoves(s.board, 0).sort((x, y) => x - y)).toEqual([at(2, 3), at(3, 2), at(4, 5), at(5, 4)]);
    const s2 = applyMove(s, s.players[0], { cell: at(2, 3) });
    expect(counts(s2.board)).toEqual([4, 1]);
    expect(s2.turn).toBe(1);
    expect(() => applyMove(s2, s.players[1], { cell: at(0, 0) })).toThrow('不能下');
  });

  it('對手沒地方下時跳過，兩邊都沒地方下時結束', () => {
    // 白棋只剩一顆，黑棋吃掉後白棋沒有棋子 → 結束
    const board: OthelloState['board'] = Array(SIZE * SIZE).fill(null);
    board[at(0, 0)] = 0;
    board[at(0, 1)] = 1;
    const s: OthelloState = { ...setup(['a', 'b'], () => 0), board };
    const end = applyMove(s, s.players[0], { cell: at(0, 2) });
    expect(end.over).toBe(true);
    expect(getResult(end, {})!.points).toEqual({ [s.players[0]]: 1 });
  });
});
