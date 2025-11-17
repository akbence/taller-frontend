import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      
      registerType: 'autoUpdate',
      
      
      manifest: {
        name: 'Taller API Client',
        short_name: 'Taller',
        description: 'Personal finaance app.',
        theme_color: '#0f172a',   
        background_color: '#0f172a', 
        display: 'standalone', 
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'image/icon-192x192.svg', 
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'image/icon-512x512.svg', 
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'image/maskable_icon_x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
      },
      

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation-cache',
              precacheFallback: {
                fallbackURL: '/index.html'
              },
            },
          },
        ],
      },
    }),
  ],
});
