import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base public path when served in production
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        aseries: resolve(__dirname, 'a-series.html'),
        partner: resolve(__dirname, 'partner.html'),
        contact: resolve(__dirname, 'contact.html'),
        admin: resolve(__dirname, 'admin.html'),
        'rag-admin': resolve(__dirname, 'rag-admin.html'),
        chatbot: resolve(__dirname, 'chatbot.html'),
        platform: resolve(__dirname, 'foundation/platform.html'),
        architecture: resolve(__dirname, 'foundation/architecture.html'),
        marketplace: resolve(__dirname, 'foundation/marketplace.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    // Middleware rewrite to serve /foundation/platform from platform.html, etc.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = req.url.split('?')[0].split('#')[0];
        if (cleanUrl === '/foundation/platform') {
          req.url = '/foundation/platform.html';
        } else if (cleanUrl === '/foundation/architecture') {
          req.url = '/foundation/architecture.html';
        } else if (cleanUrl === '/foundation/marketplace') {
          req.url = '/foundation/marketplace.html';
        }
        next();
      });
    }
  }
});
