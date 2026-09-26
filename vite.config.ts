/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Replaces %SITE_URL% in index.html with VITE_SITE_URL (e.g. https://astoria.uz), so that
 * link previews in Telegram, Facebook etc. get absolute URLs. Without it the paths stay relative
 * and the tags that must be absolute (canonical, og:url) are left out.
 */
function siteUrl(url: string): Plugin {
  const base = url.replace(/\/+$/, '')
  return {
    name: 'astoria-site-url',
    transformIndexHtml: (html) =>
      (base ? html : html.replace(/^.*(rel="canonical"|property="og:url").*\n/gm, '')).replaceAll('%SITE_URL%', base),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), siteUrl(env.VITE_SITE_URL ?? '')],
    server: {
      port: 3000,
      // The API runs separately in development (npm run dev starts both).
      proxy: {
        '/api': 'http://127.0.0.1:3001',
        '/uploads': 'http://127.0.0.1:3001',
      },
    },
    test: {
      include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
      environment: 'node',
    },
  }
})
