import { defineConfig } from 'vite';

export default defineConfig({
  // Ensure the build output goes to 'dist'
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // Base path - use '/' for root domain deployment
  base: '/',
});
