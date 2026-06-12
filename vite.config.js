import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Eat / Sleep / Train / Repeat — PWA build config.
// The app is installable to the home screen and works fully offline:
// all logging, parsing, and history live in localStorage with no backend.
export default defineConfig({
  server: {
    // the app calls /api/* on its own origin; vite forwards to the AI backend,
    // so phones on the LAN reach it through the same address as the app
    proxy: { '/api': 'http://localhost:8787' },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Eat Sleep Train Repeat',
        short_name: 'EST Repeat',
        description: 'Log food, sleep, and training in seconds. Repeat builds your patterns.',
        theme_color: '#0c0d10',
        background_color: '#08090b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // cache the built shell so the app opens offline after first visit
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
});
