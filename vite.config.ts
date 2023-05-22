import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-ignore
import * as url from "node:url";
// @ts-ignore
import { resolve } from "node:path";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      styles: resolve(__dirname, "src/styles"),
    },
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  plugins: [react()],
});
