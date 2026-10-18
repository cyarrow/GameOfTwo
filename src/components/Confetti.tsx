import { useMemo } from 'react';

const COLORS = ['#7b5cff', '#ff5fa2', '#ffb347', '#2bd9e8', '#2fd47e', '#f9d423'];

/**
 * 贏的時候從結果卡片噴出彩帶。只在自己贏的那一刻出現一次，
 * 系統設定「減少動態效果」時不顯示（CSS 會隱藏）。
 */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.4;
        const dist = 120 + Math.random() * 160;
        return {
          i,
          color: COLORS[i % COLORS.length],
          x: Math.cos(angle) * dist,
          // 往上噴得比較多，之後落下
          y: Math.sin(angle) * dist * 0.7 - 80,
          rotate: Math.random() * 720 - 360,
          delay: Math.random() * 80,
        };
      }),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.i}
          style={
            {
              background: p.color,
              '--x': `${p.x}px`,
              '--y': `${p.y}px`,
              '--r': `${p.rotate}deg`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
