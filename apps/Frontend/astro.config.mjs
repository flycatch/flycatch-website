import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_ORIGIN || 'http://localhost:8080';

function remotePatternFromOrigin(raw) {
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
  }
}

const remotePatterns = [
  remotePatternFromOrigin(site),
  remotePatternFromOrigin(process.env.API_ORIGIN || ''),
  { protocol: 'http', hostname: 'localhost' },
  { protocol: 'http', hostname: '127.0.0.1' },
  { protocol: 'http', hostname: 'backend' },
  { protocol: 'https', hostname: 'www.flycatchtech.com' },
  { protocol: 'https', hostname: '**.flycatchtech.in' },
].filter(Boolean);

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site,
  security: {
    allowedDomains: [
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
      { hostname: 'www.flycatchtech.com' },
      { hostname: '**.flycatchtech.in' },
    ],
  },
  trailingSlash: 'never',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    remotePatterns,
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    preview: {
      allowedHosts: true,
      proxy: {
        '/api/v1': {
          target: process.env.PUBLIC_ORIGIN || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    server: {
      proxy: {
        '/api/v1': {
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
