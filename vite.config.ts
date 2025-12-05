/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    cors: true,
    hmr: {
      clientPort: 8080,
      protocol: 'ws',
      host: 'localhost',
    },
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        cookieDomainRewrite: {
          'localhost:5000': 'localhost:8080'
        },
        onProxyReq: (proxyReq: any, req: any, res: any) => {
          // Forward cookies
          if (req.headers.cookie) {
            proxyReq.setHeader('Cookie', req.headers.cookie);
          }
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          // Forward Set-Cookie headers
          if (proxyRes.headers['set-cookie']) {
            
            proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map((cookie: string) => {
              // Remove domain attribute for localhost
              const modifiedCookie = cookie.replace(/; domain=.*?(;|$)/, '$1');
              return modifiedCookie;
            });
            
          }
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err: any, _req: any, _res: any) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReqWs', (proxyReq: any, req: any, socket: any) => {
            socket.on('error', (err: any) => {
              console.error('WebSocket error:', err);
            });
          });
        }
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['prop-types'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
}));
