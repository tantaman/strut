import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Server-side secrets the Rindle API + upload handlers read via process.env. Vite doesn't expose
// non-VITE_ vars to the SSR runtime by default, so load .env and assign them for `vite dev`.
// (In production the host provides real env vars.)
const SERVER_ENV = [
  'RINDLE_DAEMON_URL',
  'RINDLE_DAEMON_TOKEN',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
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
    },
    plugins: [
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
