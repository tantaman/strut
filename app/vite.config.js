// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      styles: resolve(__dirname, "src/styles"),
    },
  },

  build: {
    target: "es2020",
  },

  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
  server: {
    fs: {
      strict: false,
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
