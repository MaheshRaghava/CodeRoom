import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';
import path             from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws:     true,
      },
    },
  },
  build: {
    outDir:        'dist',
    sourcemap:     mode !== 'production',
    chunkSizeWarningLimit: 1000, // Monaco is large — suppress warning
    rollupOptions: {
      output: {
        // Split Monaco into its own chunk so initial load is faster
        manualChunks: {
          monaco:    ['@monaco-editor/react', 'monaco-editor'],
          react:     ['react', 'react-dom'],
          socket:    ['socket.io-client'],
          router:    ['react-router-dom'],
        },
      },
    },
  },
}));