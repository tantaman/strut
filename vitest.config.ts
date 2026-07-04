import { defineConfig } from 'vitest/config'

// Isolated test config (kept separate from vite.config.ts so tests don't boot the TanStack Start /
// SSR plugin chain). Pure-function suites run in node; suites needing a DOM (DOMPurify) opt in with a
// per-file `// @vitest-environment jsdom` directive.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
