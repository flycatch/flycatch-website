import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_ORIGIN || 'http://localhost:8080';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/api'),
      customPages: [
        `${site}/`,
        `${site}/about`,
        `${site}/case-studies`,
        `${site}/company/blogs`,
        `${site}/company/clients`,
        `${site}/company/testimonials`,
      ],
    }),
  ],
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    preview: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: process.env.PUBLIC_ORIGIN || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.PUBLIC_ORIGIN || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});
