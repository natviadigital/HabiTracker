import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  base: '/',
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['habitracker.natviadigital.com'],
  },
});
