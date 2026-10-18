import { useEffect, useState, type FormEvent } from 'react';
import { getBackend } from '../backend';
import {
  addBankItem,
  LIMITS,
  removeBankItem,
  validateItem,
  type BankId,
  type BankItems,
} from '../banks';
import { WORDS } from '../games/draw-guess/words';
import { QUESTIONS } from '../games/mind-meld/questions';
import { WORD_PAIRS } from '../games/undercover/words';
import { getSavedName } from '../platform/identity';
import { PUNISHMENTS } from '../platform/punishments';

const TABS: { id: BankId; label: string; builtIn: number; hint: string }[] = [
  { id: 'mind-meld', label: '🧠 默契大考驗', builtIn: QUESTIONS.length, hint: '一個題目加上 4 個選項。' },
  { id: 'draw-guess', label: '🎨 你畫我猜', builtIn: WORDS.length, hint: '畫得出來的東西最好玩。' },
  { id: 'undercover', label: '🕵️ 誰是臥底', builtIn: WORD_PAIRS.length, hint: '兩個相似但不一樣的詞，其中一個會發給臥底。' },
  { id: 'punishments', label: '😈 懲罰卡', builtIn: PUNISHMENTS.length, hint: '懲罰模式開啟時，輸的人會抽到。' },
];

type Entries<B extends BankId> = [string, BankItems[B]][];

function describeItem(bank: BankId, item: BankItems[BankId]): string {
  switch (bank) {
    case 'mind-meld': {
      const { q, options } = item as BankItems['mind-meld'];
      return `${q}（${options.join(' / ')}）`;
    }
    case 'draw-guess':
      return (item as BankItems['draw-guess']).word;
    case 'undercover': {
      const { a, b } = item as BankItems['undercover'];
      return `${a} ↔ ${b}`;
    }
    case 'punishments':
      return (item as BankItems['punishments']).text;
  }
}

export function BanksPage() {
  const [tab, setTab] = useState<BankId>('mind-meld');
  const [entries, setEntries] = useState<Entries<BankId>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const current = TABS.find((t) => t.id === tab)!;

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    setEntries([]);
    setLoadError(null);
    getBackend().then((backend) => {
      if (cancelled) return;
      unsubscribe = backend.subscribe<Record<string, BankItems[BankId]>>(
        `banks/${tab}`,
        (value) => {
          setLoadError(null);
          setEntries(Object.entries(value ?? {}).sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0)));
        },
        () => setLoadError('讀不到自訂題庫：請確認 Firebase 的資料庫規則已經更新（見 README）。'),
      );
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [tab]);

  return (
    <div className="stack banks">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>✏️ 自訂題庫</h1>
        <a className="button" href="#/" onClick={(e) => history.length > 1 && (e.preventDefault(), history.back())}>
          ← 返回
        </a>
      </div>
      <p className="muted">在這裡加的題目所有房間共用，而且會永久保存。開局時會優先抽自訂題目（每局約一半）。</p>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'primary' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <section className="card stack">
        <p className="muted">
          {current.hint} 目前有內建 {current.builtIn} 題，自訂 {entries.length} 題。
        </p>
        <AddForm key={tab} bank={tab} existing={entries.map(([, item]) => describeItem(tab, item))} />
      </section>

      {loadError && <p className="error">{loadError}</p>}

      <section className="card">
        <h3>自訂題目</h3>
        {entries.length === 0 ? (
          <p className="muted" style={{ marginTop: 8 }}>
            還沒有自訂題目，加一題吧！
          </p>
        ) : (
          <ul className="bank-list">
            {entries.map(([id, item]) => (
              <li key={id}>
                <span>
                  {describeItem(tab, item)}
                  <small className="muted"> · {item.by || '匿名'}</small>
                </span>
                <button
                  className="ghost small"
                  onClick={() =>
                    window.confirm(`刪除「${describeItem(tab, item)}」？`) &&
                    void removeBankItem(tab, id).catch(() => window.alert('刪除失敗，請確認資料庫規則已經更新。'))
                  }
                >
                  刪除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AddForm({ bank, existing }: { bank: BankId; existing: string[] }) {
  const [q, setQ] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [word, setWord] = useState('');
  const [b, setB] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function buildItem(): Record<string, unknown> {
    switch (bank) {
      case 'mind-meld':
        return { q: q.trim(), options: options.map((o) => o.trim()) };
      case 'draw-guess':
        return { word: word.trim() };
      case 'undercover':
        return { a: word.trim(), b: b.trim() };
      case 'punishments':
        return { text: word.trim() };
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const item = buildItem();
    const err = validateItem(bank, item);
    if (err) return setError(err);
    const label = describeItem(bank, item as unknown as BankItems[BankId]);
    if (existing.includes(label)) return setError('這題已經有了');
    setBusy(true);
    setError(null);
    try {
      await addBankItem(bank, { ...item, by: getSavedName() || '匿名', at: Date.now() } as BankItems[BankId]);
      setQ('');
      setOptions(['', '', '', '']);
      setWord('');
      setB('');
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError('儲存失敗：請確認 Firebase 的資料庫規則已經更新（見 README）。');
    }
    setBusy(false);
  }

  return (
    <form className="stack-sm" style={{ alignItems: 'stretch' }} onSubmit={submit}>
      {bank === 'mind-meld' && (
        <>
          <input value={q} maxLength={LIMITS.question} onChange={(e) => setQ(e.target.value)} placeholder="題目，例如：最喜歡的早餐？" aria-label="題目" />
          <div className="option-inputs">
            {options.map((o, i) => (
              <input
                key={i}
                value={o}
                maxLength={LIMITS.option}
                onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`選項 ${i + 1}`}
                aria-label={`選項 ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
      {bank === 'draw-guess' && (
        <input value={word} maxLength={LIMITS.word} onChange={(e) => setWord(e.target.value)} placeholder="要畫的詞，例如：皮卡丘" aria-label="詞" />
      )}
      {bank === 'undercover' && (
        <div className="option-inputs">
          <input value={word} maxLength={LIMITS.word} onChange={(e) => setWord(e.target.value)} placeholder="詞 A，例如：可樂" aria-label="詞 A" />
          <input value={b} maxLength={LIMITS.word} onChange={(e) => setB(e.target.value)} placeholder="詞 B，例如：雪碧" aria-label="詞 B" />
        </div>
      )}
      {bank === 'punishments' && (
        <input value={word} maxLength={LIMITS.punishment} onChange={(e) => setWord(e.target.value)} placeholder="懲罰內容，例如：學貓叫三聲" aria-label="懲罰內容" />
      )}
      <div className="row">
        <button type="submit" className="primary" disabled={busy}>
          新增
        </button>
        {saved && <span className="success">已新增 ✓</span>}
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
