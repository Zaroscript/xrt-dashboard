/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    plugins: [react()],

    base: "/", // IMPORTANT for correct asset paths

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      cors: true,

      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 8080,
      },

      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },

    build: {
      outDir: "dist",
      assetsDir: "assets",
      emptyOutDir: true,

      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },

    optimizeDeps: {
      include: ["prop-types"],
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
  };
});
