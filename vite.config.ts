import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cloudflare Workers build is opt-in via CF=1 (see `pnpm build:cf` / `pnpm deploy`). Local `pnpm dev`
// and the default `pnpm build` stay on the Node runtime so the rindled daemon + local upload
// fallback keep working unchanged. The `cloudflare()` plugin runs the SSR env in workerd and reads
// wrangler.jsonc (bindings, nodejs_compat) — only wanted for the actual CF deploy target.
const CF = process.env.CF === '1'

// Server-side secrets the Rindle API + upload handlers read via process.env. Vite doesn't expose
// non-VITE_ vars to the SSR runtime by default, so load .env and assign them for `vite dev`.
// (In production the host provides real env vars.)
const SERVER_ENV = [
  'RINDLE_DAEMON_URL',
  'RINDLE_DAEMON_WS',
  'RINDLE_DAEMON_TOKEN',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
  'ARTIFACT_ORIGIN',
  // Better-Auth (server/auth.ts). Under `pnpm dev` sessions run off a local better-sqlite3 DB, so only
  // the secret + base URL are needed for the guest flow; the OAuth creds are optional (promotion).
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'STRUT_AUTH_DB',
]

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of SERVER_ENV) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    resolve: { tsconfigPaths: true },
    server: {
      port: 3000,
      // The Rindle API + image upload are now TanStack Start server routes (src/routes/api.rindle.*),
      // served same-origin — no separate API process, no proxy. The live-query WebSocket still
      // connects directly to the daemon (:7601).
      // Don't let runtime-written files under .uploads/ (the local-disk dev fallback for image uploads
      // and runnable artifacts) trip the HMR watcher — otherwise saving one forces a full page reload
      // mid-edit (e.g. right after every artifact "Run"). Prod builds on Workers never write here.
      watch: { ignored: ['**/.uploads/**'] },
    },
    plugins: [
      ...(CF ? [cloudflare({ viteEnvironment: { name: 'ssr' } })] : []),
      // `consolePiping` cross-forwards console between the SSR server and the browser (server logs →
      // browser console, client logs → terminal). That bidirectional forwarding echoes: one server
      // console.error becomes a browser console.error, which pipes back as a server log, re-wrapped
      // with a `[Server]` prefix each round — a repeated log (e.g. a React warning or a Rindle
      // fetch-retry) snowballs into a multi-GB HMR-websocket payload and OOM-kills `vite dev`.
      // Disable the piping (keeps the devtools panel + source injection). See RINDLE/dev notes.
      devtools({ consolePiping: { enabled: false } }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
