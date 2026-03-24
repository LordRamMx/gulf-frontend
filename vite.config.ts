import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    allowedHosts: [
      'leatha-inconsequential-deneen.ngrok-free.dev', // El dominio específico
      '.ngrok-free.app', // O cualquier subdominio de ngrok-free.app
      '.ngrok-free.dev'  // O cualquier subdominio de ngrok-free.dev
    ],
  },
})