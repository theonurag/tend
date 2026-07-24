import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/tend/",
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        guide: resolve(import.meta.dirname, "guide.html")
      }
    }
  }
});
