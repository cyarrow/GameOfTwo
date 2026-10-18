import { GameError, type GameResult } from '../types';
import { nameOf } from '../helpers';
import { createRng, randomSeed } from '../rng';
import { shuffle } from '../shuffle';

export type Color = 'r' | 'y' | 'g' | 'b';
export type Value = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  color: Color | null;
  value: Value;
}

export const COLORS: Color[] = ['r', 'y', 'g', 'b'];
export const HAND_SIZE = 7;

/** 108 張牌：每色 0 一張、1～9 各兩張、跳過/迴轉/+2 各兩張，加上萬用牌與 +4 各四張 */
export const DECK: Card[] = (() => {
  const deck: Card[] = [];
  for (const color of COLORS) {
    deck.push({ color, value: '0' });
    for (const value of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'] as Value[]) {
      deck.push({ color, value }, { color, value });
    }
  }
  for (let i = 0; i < 4; i++) deck.push({ color: null, value: 'wild' }, { color: null, value: 'wild4' });
  return deck;
})();

export interface LastAction {
  by: string;
  kind: 'play' | 'draw' | 'pass';
  card?: number;
  /** +2 / +4 的受害者與張數 */
  victim?: string;
  penalty?: number;
}

export interface ColorChainState {
  order: string[];
  turn: number;
  direction: 1 | -1;
  /** 手牌與牌堆存的是 DECK 的編號 */
  hands: Record<string, number[]>;
  drawPile: number[];
  discard: number[];
  color: Color;
  /** 這回合抽到的牌：抽牌後只能出這張或跳過 */
  drawn: number | null;
  seed: number;
  winner: string | null;
  last: LastAction | null;
}

export type ColorChainMove = { type: 'play'; card: number; color?: Color } | { type: 'draw' } | { type: 'pass' };

export function setup(playerIds: string[], random: () => number): ColorChainState {
  const deck = shuffle(
    DECK.map((_, i) => i),
    random,
  );
  const order = shuffle(playerIds, random);
  const hands: Record<string, number[]> = {};
  order.forEach((id, i) => (hands[id] = deck.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE)));
  const rest = deck.slice(order.length * HAND_SIZE);
  // 翻開第一張數字牌當起點
  const firstIndex = rest.findIndex((c) => /^\d$/.test(DECK[c].value));
  const first = rest[firstIndex];
  rest.splice(firstIndex, 1);
  return {
    order,
    turn: 0,
    direction: 1,
    hands,
    drawPile: rest,
    discard: [first],
    color: DECK[first].color!,
    drawn: null,
    seed: randomSeed(random),
    winner: null,
    last: null,
  };
}

export function topCard(state: ColorChainState): Card {
  return DECK[state.discard[state.discard.length - 1]];
}

export function canPlay(state: ColorChainState, cardId: number): boolean {
  const card = DECK[cardId];
  return card.color === null || card.color === state.color || card.value === topCard(state).value;
}

export function currentPlayer(state: ColorChainState): string {
  return state.order[state.turn];
}

function step(state: ColorChainState, steps: number, direction = state.direction): number {
  const n = state.order.length;
  return (((state.turn + direction * steps) % n) + n) % n;
}

/** 抽 n 張；牌堆抽完時把棄牌堆（除了最上面那張）洗回來 */
function drawCards(state: ColorChainState, n: number): { state: ColorChainState; cards: number[] } {
  let { drawPile, discard, seed } = state;
  const cards: number[] = [];
  for (let i = 0; i < n; i++) {
    if (drawPile.length === 0) {
      if (discard.length <= 1) break;
      const rng = createRng(seed);
      drawPile = shuffle(discard.slice(0, -1), rng.random);
      discard = discard.slice(-1);
      seed = rng.seed;
    }
    cards.push(drawPile[0]);
    drawPile = drawPile.slice(1);
  }
  return { state: { ...state, drawPile, discard, seed }, cards };
}

export function applyMove(state: ColorChainState, playerId: string, move: ColorChainMove): ColorChainState {
  if (state.winner) throw new GameError('這局已經結束了');
  if (currentPlayer(state) !== playerId) throw new GameError('還沒輪到你');
  const hand = state.hands[playerId];

  if (move.type === 'draw') {
    if (state.drawn !== null) throw new GameError('這回合已經抽過牌了');
    const { state: s, cards } = drawCards(state, 1);
    const next = { ...s, hands: { ...s.hands, [playerId]: [...hand, ...cards] }, last: { by: playerId, kind: 'draw' as const } };
    // 抽到的牌不能出就自動換下一位
    if (cards.length === 0 || !canPlay(next, cards[0])) return { ...next, turn: step(next, 1), drawn: null };
    return { ...next, drawn: cards[0] };
  }

  if (move.type === 'pass') {
    if (state.drawn === null) throw new GameError('要先抽一張牌才能跳過');
    return { ...state, turn: step(state, 1), drawn: null, last: { by: playerId, kind: 'pass' } };
  }

  const { card } = move;
  if (!hand.includes(card)) throw new GameError('你手上沒有這張牌');
  if (state.drawn !== null && card !== state.drawn) throw new GameError('抽牌後只能出剛抽到的那張');
  if (!canPlay(state, card)) throw new GameError('這張牌不能出：顏色或數字要跟上一張一樣');
  const c = DECK[card];
  if (c.color === null && !COLORS.includes(move.color as Color)) throw new GameError('請選擇顏色');

  let next: ColorChainState = {
    ...state,
    hands: { ...state.hands, [playerId]: hand.filter((x) => x !== card) },
    discard: [...state.discard, card],
    color: c.color ?? (move.color as Color),
    drawn: null,
    last: { by: playerId, kind: 'play', card },
  };
  if (next.hands[playerId].length === 0) return { ...next, winner: playerId };

  const twoPlayers = state.order.length === 2;
  if (c.value === 'skip' || (c.value === 'reverse' && twoPlayers)) {
    next.turn = step(next, 2);
  } else if (c.value === 'reverse') {
    next.direction = state.direction === 1 ? -1 : 1;
    next.turn = step(next, 1, next.direction);
  } else if (c.value === 'draw2' || c.value === 'wild4') {
    const penalty = c.value === 'draw2' ? 2 : 4;
    const victim = state.order[step(next, 1)];
    const drawn = drawCards(next, penalty);
    next = drawn.state;
    next.hands = { ...next.hands, [victim]: [...next.hands[victim], ...drawn.cards] };
    next.last = { ...next.last!, victim, penalty };
    next.turn = step(next, 2);
  } else {
    next.turn = step(next, 1);
  }
  return next;
}

export function getResult(state: ColorChainState, names: Record<string, string>): GameResult | null {
  if (!state.winner) return null;
  return { points: { [state.winner]: 1 }, message: `🌈 ${nameOf(names, state.winner)} 第一個出完手牌！` };
}
