import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'util', 'stream', 'process', 'buffer'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Cho phép truy cập qua mạng LAN
    proxy: {
      '/api': {
        target: `http://${process.env.VITE_SERVER_IP || 'localhost'}:${process.env.VITE_SERVER_PORT || '3000'}`,
        changeOrigin: true,
      },
      '/socket.io': {
        target: `http://${process.env.VITE_SERVER_IP || 'localhost'}:${process.env.VITE_SERVER_PORT || '3000'}`,
        ws: true,
      },
    },
  },
});
