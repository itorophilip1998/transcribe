import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.ts';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        offscreen: resolve(rootDir, 'offscreen.html'),
      },
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
