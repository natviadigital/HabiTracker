import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Output directly to Hostinger's web root (public_html)
    // The app code lives in /nodejs/, so ../public_html is the web root
    outDir: '../public_html',
    emptyOutDir: true,
  },
  base: '/',
});
