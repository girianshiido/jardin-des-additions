import { defineConfig } from 'vite';
// Previously opened or cached pages may still reference the previous release's assets.
export default defineConfig({ base: './', build: { outDir: 'docs', emptyOutDir: false } });
