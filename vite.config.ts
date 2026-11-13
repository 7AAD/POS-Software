import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Serve and bundle SQLite's engine locally; the app never downloads it from a CDN.
const wasm = readFileSync(fileURLToPath(
  new URL('./node_modules/sql.js/dist/sql-wasm-browser.wasm', import.meta.url),
));

export default defineConfig({
  // Relative assets work at a GitHub Pages repository path and inside Android.
  base: './',
  server: { host: '0.0.0.0', port: 8000, strictPort: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  plugins: [react(), {
    name: 'local-sqlite-engine',
    configureServer(server) {
      server.middlewares.use('/assets/sql-wasm-browser.wasm', (_request, response) => {
        response.setHeader('Content-Type', 'application/wasm');
        response.end(wasm);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'assets/sql-wasm-browser.wasm', source: wasm });
    },
  }],
});
