import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));

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
        main: resolve(rootDirectory, "index.html"),
        guide: resolve(rootDirectory, "guide.html")
      }
    }
  }
});
