import { defineConfig } from 'vite';
export default defineConfig(({ mode }) => ({
  base: mode === 'cloudflare' ? '/presentation/2026-10-23-ripple-review/' : './',
  build: {
    assetsInlineLimit: 1000000,
    outDir: mode === 'cloudflare' ? 'worker-dist/presentation/2026-10-23-ripple-review' : 'dist',
  },
}));
