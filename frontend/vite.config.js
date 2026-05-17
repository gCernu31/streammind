import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';

const routes = ['/', '/analisi', '/faq', '/changelog', '/status'];

export default defineConfig({
  plugins: [
    react(),
    Sitemap({
      hostname: 'https://streamindai.com',
      dynamicRoutes: routes,
      exclude: ['/dashboard', '/config', '/memory', '/subscription', '/guide', '/login'],
      generateRobotsTxt: false,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
