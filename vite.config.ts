import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// 每次建置的版本代號：GitHub Actions 上用 commit，本機用時間
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 7) ?? Date.now().toString(36);

/** 輸出 version.json，網站會定期讀它來判斷有沒有新版本 */
function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) });
    },
  };
}

// base './' 讓網站放在 GitHub Pages 的子路徑（/<repo>/）也能正常載入
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react(), versionFile()],
});
