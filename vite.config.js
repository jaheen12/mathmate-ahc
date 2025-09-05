import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { VitePWA } from 'vite-plugin-pwa' // <-- Import the PWA plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // --- This is the new PWA plugin configuration ---
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the service worker
      strategies: 'injectManifest',
      srcDir: 'public', // The source directory of your custom service worker
      filename: 'sw.js', // The name of your custom service worker file

      // Configuration for the manifest.json file
      manifest: {
        name: 'MathMate AHC',
        short_name: 'MathMate',
        description: 'Your educational companion app for offline use.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Important for a better icon look on Android
          }
        ]
      },

      // Dev options for testing the service worker in development mode
      devOptions: {
        enabled: true
      }
    })
  ],
  // Your existing CSS configuration is preserved here
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
})