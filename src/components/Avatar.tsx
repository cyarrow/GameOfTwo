const AVATAR_COLORS = ['#7b5cff', '#ff5fa2', '#ff8a3d', '#22b07d', '#3f8efc', '#e8505b', '#c471f5', '#14b8c4'];

/** 依玩家 id 固定配一個顏色，同一個人在每台裝置上看到的顏色都一樣 */
function colorFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ id, name, size = 32, dim = false }: { id: string; name: string; size?: number; dim?: boolean }) {
  return (
    <span
      className={`avatar ${dim ? 'dim' : ''}`}
      style={{ background: colorFor(id), width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {[...name.trim()][0] ?? '?'}
    </span>
  );
}
