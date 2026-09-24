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
        `${site}/company/about-us`,
        `${site}/company/careers`,
        `${site}/company/jobs-openings`,
        `${site}/services`,
        `${site}/services/ai-services`,
        `${site}/services/application-development-services`,
        `${site}/services/application-modernization`,
        `${site}/services/user-centered-design`,
        `${site}/services/mobile-application-development`,
        `${site}/services/devOps-consultation`,
        `${site}/services/infrastructure-management-and-automation`,
        `${site}/solutions`,
        `${site}/solutions/doctCare-ai`,
        `${site}/solutions/docSis-ai`,
        `${site}/solutions/talkShop-ai`,
        `${site}/solutions/flyGrid-ai`,
        `${site}/solutions/procure-flex`,
        `${site}/solutions/credit-life`,
        `${site}/solutions/com-bus`,
        `${site}/solutions/ai-chat-support`,
        `${site}/case-studies`,
        `${site}/company/blogs`,
        `${site}/company/news-and-events`,
        `${site}/company/resources`,
        `${site}/company/memberships`,
        `${site}/company/clients`,
        `${site}/company/testimonials`,
      ],
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
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
