import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 60_000;

/**
 * 定期檢查網站有沒有新版本（GitHub Pages 會快取舊的網頁，大家不一定會重新整理）。
 * 回傳新版本的代號；沒有新版本時是 null。只在正式建置的網站上運作。
 */
export function useUpdateCheck(): string | null {
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let stopped = false;

    async function check() {
      try {
        const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { id } = (await res.json()) as { id?: string };
        if (!stopped && id && id !== __BUILD_ID__) setLatest(id);
      } catch {
        // 離線或暫時連不到就下次再試
      }
    }

    const onVisible = () => document.visibilityState === 'visible' && void check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    // 切回這個分頁或視窗時馬上檢查一次（例如手機鎖屏後再打開）
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    void check();
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []);

  return latest;
}

/** 用帶有版本代號的網址重新載入，繞過瀏覽器快取；網址的 # 部分（目前所在的房間）會保留 */
export function reloadToVersion(id: string) {
  const { pathname, hash } = window.location;
  window.location.replace(`${pathname}?v=${encodeURIComponent(id)}${hash}`);
}
