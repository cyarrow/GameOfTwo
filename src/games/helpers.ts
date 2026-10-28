import { useState } from 'react';

/** 分數最高的玩家（可能同分多人）各得 1 分。全部都是 0 分時沒有人得分。 */
export function pointsForTop(scores: Record<string, number>): { winners: string[]; points: Record<string, number> } {
  const best = Math.max(0, ...Object.values(scores));
  const winners = best > 0 ? Object.keys(scores).filter((id) => scores[id] === best) : [];
  return { winners, points: Object.fromEntries(winners.map((id) => [id, 1])) };
}

export function nameOf(names: Record<string, string>, id: string): string {
  return names[id] ?? '（已離開）';
}

export function joinNames(names: Record<string, string>, ids: string[]): string {
  return ids.map((id) => nameOf(names, id)).join('、');
}

/**
 * 每位玩家的最短不重複縮寫：通常取名字第一個字，開頭一樣時多取幾個字
 * （例如「小明」「小華」→「小明」「小華」，「阿美」→「阿」）
 */
export function shortNames(ids: string[], names: Record<string, string>): Record<string, string> {
  const chars = ids.map((id) => [...nameOf(names, id)]);
  return Object.fromEntries(
    ids.map((id, i) => {
      let n = 1;
      const prefix = (c: string[]) => c.slice(0, n).join('');
      while (n < chars[i].length && chars.some((c, j) => j !== i && prefix(c) === prefix(chars[i]))) n++;
      return [id, prefix(chars[i])];
    }),
  );
}

/** 每位玩家的代表色，依該局玩家順序分配 */
export const PLAYER_COLORS = ['#e8505b', '#3f8efc', '#f5a524', '#22b07d'];

/** 送出動作時的等待狀態與錯誤訊息 */
export function useMove<M>(sendMove: (move: M) => Promise<string | null>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function send(move: M) {
    setBusy(true);
    const err = await sendMove(move);
    setBusy(false);
    setError(err);
    return err;
  }
  return { send, error, busy };
}
