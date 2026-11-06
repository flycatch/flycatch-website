import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Dev only: pages live in src/pages/admin/ and `base` is /admin, so Astro's dev server serves them at
// /admin/admin/*. Production (and the in-app links) use /admin/*, so map page requests to match.
// Vite strips the base before plugin middleware runs, hence paths here are relative to /admin.
const adminDevRewrite = {
  name: 'admin-dev-url-rewrite',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const [path, query = ''] = (req.url ?? '').split('?');
      const isPage =
        !path.startsWith('/admin') &&
        !/^\/(@|_astro|src|node_modules)/.test(path) &&
        !/\.[a-z0-9]+$/i.test(path);
      if (isPage) req.url = `/admin${path}${query ? `?${query}` : ''}`;
      next();
    });
  },
};

export default defineConfig({
  output: 'static',
  base: '/admin',
  trailingSlash: 'always',
  integrations: [react()],
  vite: {
    preview: {
      allowedHosts: true,
    },
    plugins: [adminDevRewrite],
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
