/**
 * 可重現的亂數（mulberry32）。applyMove 必須是純函式，不能呼叫 Math.random，
 * 所以遊戲進行中需要亂數時（例如重新洗牌），把種子存在遊戲狀態裡，用它產生亂數。
 */
export function createRng(seed: number) {
  let s = seed >>> 0;
  return {
    random(): number {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    get seed(): number {
      return s;
    },
  };
}

export function randomSeed(random: () => number): number {
  return Math.floor(random() * 4294967296);
}
