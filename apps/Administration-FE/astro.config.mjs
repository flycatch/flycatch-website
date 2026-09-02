import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  base: '/admin',
  trailingSlash: 'always',
  integrations: [react()],
  vite: {
    preview: {
      allowedHosts: true,
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.PUBLIC_ORIGIN || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  },
});
