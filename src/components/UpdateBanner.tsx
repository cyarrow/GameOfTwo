import { useState } from 'react';
import { reloadToVersion, useUpdateCheck } from '../platform/useUpdateCheck';

/** 有新版本時從畫面上方滑出提示；由玩家決定什麼時候更新（例如等這局玩完） */
export function UpdateBanner() {
  const latest = useUpdateCheck();
  const [dismissed, setDismissed] = useState<string | null>(null);
  if (!latest || dismissed === latest) return null;

  return (
    <div className="update-banner" role="status">
      <span>🎉 網站有新版本！</span>
      <div className="row">
        <button className="primary small" onClick={() => reloadToVersion(latest)}>
          更新
        </button>
        <button className="ghost small" onClick={() => setDismissed(latest)}>
          稍後
        </button>
      </div>
    </div>
  );
}
