import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Usar base relativa './' permite que o app funcione em qualquer subdiretório (GitHub Pages, Sandboxes, etc.)
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    fs: {
      allow: ['.'],
    },
  },
});