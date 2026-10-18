import { useEffect, useRef, useState } from 'react';

/** 分數增加時數字彈一下，並飄出「+N」：讓大家一眼看出誰剛得分 */
export function ScoreBump({ value }: { value: number }) {
  const prev = useRef(value);
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);

  useEffect(() => {
    const diff = value - prev.current;
    prev.current = value;
    if (diff <= 0) return;
    setGain({ n: diff, key: Date.now() });
    const t = setTimeout(() => setGain(null), 1200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span className="score-wrap">
      <span key={gain?.key ?? 'static'} className={`score ${gain ? 'bump' : ''}`}>
        {value} 分
      </span>
      {gain && (
        <span key={`g${gain.key}`} className="score-gain" aria-hidden="true">
          +{gain.n}
        </span>
      )}
    </span>
  );
}
