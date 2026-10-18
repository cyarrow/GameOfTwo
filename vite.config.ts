import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' 讓網站放在 GitHub Pages 的子路徑（/<repo>/）也能正常載入
export default defineConfig({
  base: './',
  plugins: [react()],
});
