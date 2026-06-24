import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    // Strut's Rindle API server runs standalone on :7700; proxy its routes so the browser stays
    // same-origin (no CORS). The live-query WebSocket connects directly to the daemon (:7601).
    proxy: {
      '/api/rindle': 'http://127.0.0.1:7700',
    },
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
