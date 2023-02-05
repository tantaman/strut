// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  resolve: {
    alias: {
      styles: resolve(__dirname, "src/styles"),
    },
  },

  plugins: [visualizer()],

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
  },
});
