import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)
const wasmBin = require.resolve('@rindle/wasm/pkg/rindle_bg.wasm')

// Isolated test config (kept separate from vite.config.ts so tests don't boot the TanStack Start /
// SSR plugin chain). Pure-function suites run in node; suites needing a DOM (DOMPurify) opt in with a
// per-file `// @vitest-environment jsdom` directive.
export default defineConfig({
  resolve: {
    alias: [{ find: /^rindle-wasm-bin/, replacement: wasmBin }],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
