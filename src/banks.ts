import { getBackend } from './backend';
import { shuffle } from './games/shuffle';
import type { Question } from './games/mind-meld/questions';

/**
 * 自訂題庫：存在資料庫的 banks/<題庫>/<題目 id>，所有房間共用。
 * 開局時讀一次，把自訂題目傳給遊戲的 setup。
 */
export type BankId = 'mind-meld' | 'draw-guess' | 'undercover' | 'punishments';

export const LIMITS = {
  question: 40,
  option: 12,
  word: 10,
  punishment: 40,
};

interface Meta {
  by: string;
  at: number;
}
export type MindMeldItem = Meta & Question;
export type DrawGuessItem = Meta & { word: string };
export type UndercoverItem = Meta & { a: string; b: string };
export type PunishmentItem = Meta & { text: string };

export interface BankItems {
  'mind-meld': MindMeldItem;
  'draw-guess': DrawGuessItem;
  undercover: UndercoverItem;
  punishments: PunishmentItem;
}

/** 給遊戲用的自訂內容（已驗證過格式） */
export interface CustomContent {
  mindMeld: Question[];
  drawGuess: string[];
  undercover: [string, string][];
  punishments: string[];
}

export const EMPTY_CONTENT: CustomContent = { mindMeld: [], drawGuess: [], undercover: [], punishments: [] };

const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** 檢查一筆題目的格式；不合法時回傳錯誤訊息 */
export function validateItem(bank: BankId, item: Record<string, unknown>): string | null {
  switch (bank) {
    case 'mind-meld': {
      const { q, options } = item;
      if (!isText(q, LIMITS.question)) return `題目要 1～${LIMITS.question} 個字`;
      if (!Array.isArray(options) || options.length !== 4 || !options.every((o) => isText(o, LIMITS.option))) {
        return `4 個選項都要填，每個 1～${LIMITS.option} 個字`;
      }
      if (new Set(options.map((o: string) => o.trim())).size !== 4) return '選項不能重複';
      return null;
    }
    case 'draw-guess':
      return isText(item.word, LIMITS.word) ? null : `詞要 1～${LIMITS.word} 個字`;
    case 'undercover': {
      const { a, b } = item;
      if (!isText(a, LIMITS.word) || !isText(b, LIMITS.word)) return `兩個詞都要填，每個 1～${LIMITS.word} 個字`;
      if (a.trim() === b.trim()) return '兩個詞不能一樣';
      if (a.includes(b.trim()) || b.includes(a.trim())) return '兩個詞不能互相包含（描述時會變成直接說出答案）';
      return null;
    }
    case 'punishments':
      return isText(item.text, LIMITS.punishment) ? null : `懲罰要 1～${LIMITS.punishment} 個字`;
  }
}

function valuesOf(raw: unknown): unknown[] {
  return raw && typeof raw === 'object' ? Object.values(raw) : [];
}

/** 把資料庫讀到的原始資料整理成遊戲用的格式，格式不對的題目直接略過 */
export function parseContent(raw: unknown): CustomContent {
  const banks = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const valid = <B extends BankId>(bank: B) =>
    valuesOf(banks[bank]).filter(
      (x): x is BankItems[B] => !!x && typeof x === 'object' && validateItem(bank, x as Record<string, unknown>) === null,
    );
  return {
    mindMeld: valid('mind-meld').map(({ q, options }) => ({ q: q.trim(), options: options.map((o) => o.trim()) as Question['options'] })),
    drawGuess: valid('draw-guess').map(({ word }) => word.trim()),
    undercover: valid('undercover').map(({ a, b }) => [a.trim(), b.trim()] as [string, string]),
    punishments: valid('punishments').map(({ text }) => text.trim()),
  };
}

/** 讀取全部自訂題庫；讀不到（例如資料庫規則還沒更新）時當作沒有自訂題目 */
export async function fetchCustomContent(): Promise<CustomContent> {
  try {
    const backend = await getBackend();
    return parseContent(await backend.get('banks'));
  } catch (e) {
    console.warn('讀取自訂題庫失敗，只使用內建題目', e);
    return EMPTY_CONTENT;
  }
}

/**
 * 從自訂與內建題目中抽 count 題：自訂題目優先，最多佔一半，其餘從內建補上。
 * 不然自訂的幾題混在上百題內建題目裡，幾乎抽不到。
 */
export function pickMixed<T>(custom: T[], builtIn: T[], count: number, random: () => number, key: (t: T) => string = String): T[] {
  const fromCustom = shuffle(custom, random).slice(0, Math.ceil(count / 2));
  const used = new Set(fromCustom.map(key));
  const fromBuiltIn = shuffle(
    builtIn.filter((x) => !used.has(key(x))),
    random,
  ).slice(0, count - fromCustom.length);
  return shuffle([...fromCustom, ...fromBuiltIn], random);
}

/** 抽一個：有自訂題目時一半機率從自訂裡抽 */
export function pickOne<T>(custom: T[], builtIn: T[], random: () => number): T {
  const pool = custom.length > 0 && random() < 0.5 ? custom : builtIn;
  return pool[Math.floor(random() * pool.length)];
}

export async function addBankItem<B extends BankId>(bank: B, item: BankItems[B]): Promise<void> {
  const backend = await getBackend();
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  await backend.set(`banks/${bank}/${id}`, item);
}

export async function removeBankItem(bank: BankId, id: string): Promise<void> {
  const backend = await getBackend();
  await backend.remove(`banks/${bank}/${id}`);
}
