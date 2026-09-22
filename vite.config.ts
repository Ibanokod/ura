import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, type Plugin } from 'vitest/config'

// Chemin de base : « / » en local, « /ura/ » sur GitHub Pages (variable posée par le workflow).
const base = process.env.BASE_PATH ?? '/'

// Version affichée dans les réglages : permet de vérifier qu'une mise à jour est arrivée.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// Politique de sécurité du contenu (production seulement : le serveur de dev injecte des
// scripts en ligne). Scripts et styles de l'appli uniquement, images depuis le CDN TCGdex,
// aucune connexion sortante, aucun cadre, aucun formulaire.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://assets.tcgdex.net",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ')

const cspMeta: Plugin = {
  name: 'ura-csp-meta',
  apply: 'build',
  transformIndexHtml() {
    return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }]
  },
}

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    // Aucune ressource inlinée en data: (polices, images) : la CSP reste stricte.
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    cspMeta,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Ura',
        short_name: 'Ura',
        description: "Traqueur d'eau avec récompenses façon Pokémon TCG Pocket",
        lang: 'fr',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Coquille de l'appli précachée ; images de cartes mises en cache à la volée (90 jours).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/assets\.tcgdex\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tcgdex-images',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
