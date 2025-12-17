import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],

  // Base URL relativa para Electron (carga desde file://)
  base: './',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Configuración de build
  build: {
    // Output al directorio de Electron
    outDir: '../desktop/dist/renderer',
    emptyOutDir: true,
    // Sourcemaps para debugging
    sourcemap: true,
    // Optimizaciones
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
        },
      },
    },
  },

  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
