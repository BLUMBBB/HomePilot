import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/**', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg'],
      manifest: {
        name: 'HomePilot',
        short_name: 'HomePilot',
        description: 'Подписка на бытовую помощь в Алматы',
        theme_color: '#1c2b1e',
        background_color: '#f9f8f4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/v1/tariffs') ||
              url.pathname.startsWith('/api/v1/apartment-types'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-public-v1',
              expiration: { maxEntries: 20, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
