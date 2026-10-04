import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\/([^/]+)$/,
        replacement: `${fileURLToPath(new URL("../../lib", import.meta.url))}/$1/index.ts`,
      },
    ],
  },
  build: { outDir: "../../data/web", emptyOutDir: true, target: "es2024" },
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4318",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (outgoing, incoming) => {
            if (incoming.headers.origin === "http://127.0.0.1:1420")
              outgoing.setHeader("origin", "http://127.0.0.1:4318");
          });
        },
      },
    },
  },
});
