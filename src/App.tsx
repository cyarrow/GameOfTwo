import { useEffect, useState } from 'react';
import { backendKind } from './backend';
import { UpdateBanner } from './components/UpdateBanner';
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

/** 內容捲到導覽列底下時才顯示分隔線（捲動邊緣效果），在最上面時導覽列與背景融為一體 */
function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

export function App() {
  const hash = useHash();
  const scrolled = useScrolled();
  const roomCode = hash.match(/^#\/room\/([A-Za-z0-9]+)/)?.[1]?.toUpperCase();

  return (
    <div className="app">
      <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#/" className="brand">
          <span className="brand-mark">🎲</span>
          GameOfTwo
        </a>
        <a href="#/banks" className="topbar-link">
          ✏️ 自訂題庫
        </a>
      </header>
      <UpdateBanner />
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
