import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_ORIGIN || 'http://localhost:8080';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site,
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => {
        if (page.includes('/admin') || page.includes('/api') || page.includes('/about')) return false;
        if (page.endsWith('/en') || page.includes('/en/')) return false;
        if (page.endsWith('/company/membership')) return false;
        if (page.endsWith('/services/data-management')) return false;
        if (page.endsWith('/solutions/combus') || page.includes('/solutions/combus/')) return false;
        return true;
      },
      customPages: [
        `${site}/`,
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
        `${site}/services/cloud-migration`,
        `${site}/services/data-migration`,
        `${site}/services/digital-transformation`,
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
        `${site}/contact-us`,
        `${site}/privacy-policy`,
        `${site}/terms-and-conditions`,
        `${site}/software-development-services-in-saudi-arabia`,
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
        '/api/v1/public/contacts': {
          target: process.env.CONTACT_API_ORIGIN || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
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
