import { useEffect, useState } from 'react';
import { backendKind } from './backend';
import { BanksPage } from './pages/BanksPage';
import { HomePage } from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';

/** 用網址的 # 部分做路由（#/room/ABCD），GitHub Pages 不需要額外設定。 */
function useHash(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export function App() {
  const hash = useHash();
  const roomCode = hash.match(/^#\/room\/([A-Za-z0-9]+)/)?.[1]?.toUpperCase();

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark">🎲</span>
          GameOfTwo
        </a>
        <a href="#/banks" className="topbar-link">
          ✏️ 自訂題庫
        </a>
      </header>
      <main className="content">
        {roomCode ? <RoomPage key={roomCode} code={roomCode} /> : hash.startsWith('#/banks') ? <BanksPage /> : <HomePage />}
      </main>
      {backendKind === 'local' && (
        <footer className="local-banner">
          目前是<strong>本機示範模式</strong>：只能在同一個瀏覽器的不同分頁之間連線。設定 Firebase 後就能跟朋友線上玩（見 README）。
        </footer>
      )}
    </div>
  );
}
