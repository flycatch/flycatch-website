import { describe, expect, it } from 'vitest';
import {
  buildSitemapXml,
  sitemapLoc,
  sitemapMetaForPath,
  staticSitemapPaths,
} from '../../src/lib/sitemap-routes';

describe('sitemap routes', () => {
  it('lists static marketing paths without about or combus duplicates', () => {
    const paths = staticSitemapPaths();
    expect(paths).toContain('/');
    expect(paths).toContain('/services');
    expect(paths).toContain('/company/blogs');
    expect(paths).toContain('/privacy-policy');
    expect(paths).toContain('/terms-and-conditions');
    expect(paths).toContain('/solutions/docSis-ai');
    expect(paths).not.toContain('/about');
    expect(paths).not.toContain('/health');
    expect(paths).not.toContain('/solutions/combus');
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('matches production loc shape (home without trailing slash)', () => {
    expect(sitemapLoc('https://www.flycatchtech.com', '/')).toBe('https://www.flycatchtech.com');
    expect(sitemapLoc('https://www.flycatchtech.com/', '/services')).toBe(
      'https://www.flycatchtech.com/services',
    );
  });

  it('matches production priority and changefreq rules', () => {
    expect(sitemapMetaForPath('/')).toEqual({ changefreq: 'daily', priority: '1' });
    expect(sitemapMetaForPath('/services')).toEqual({ changefreq: 'monthly', priority: '0.9' });
    expect(sitemapMetaForPath('/services/ai-services')).toEqual({
      changefreq: 'monthly',
      priority: '0.8',
    });
    expect(sitemapMetaForPath('/solutions/credit-life')).toEqual({
      changefreq: 'monthly',
      priority: '0.8',
    });
    expect(sitemapMetaForPath('/solutions/doctCare-ai')).toEqual({
      changefreq: 'monthly',
      priority: '0.7',
    });
    expect(sitemapMetaForPath('/company/blogs/example')).toEqual({
      changefreq: 'weekly',
      priority: '0.5',
    });
    expect(sitemapMetaForPath('/privacy-policy')).toEqual({
      changefreq: 'yearly',
      priority: '0.2',
    });
  });

  it('builds a urlset with lastmod, changefreq, priority, and no trailing-slash twins', () => {
    const xml = buildSitemapXml(
      'https://www.flycatchtech.com',
      ['/', '/services', '/services/', '/company/blogs/example'],
      '2026-09-28T23:17:14.887Z',
    );
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://www.flycatchtech.com</loc>');
    expect(xml).not.toContain('<loc>https://www.flycatchtech.com/</loc>');
    expect(xml).toContain('<loc>https://www.flycatchtech.com/services</loc>');
    expect(xml).toContain('<lastmod>2026-09-28T23:17:14.887Z</lastmod>');
    expect(xml).toContain('<changefreq>daily</changefreq>');
    expect(xml).toContain('<priority>1</priority>');
    expect(xml).toContain('<changefreq>monthly</changefreq>');
    expect(xml).toContain('<priority>0.9</priority>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<priority>0.5</priority>');
    expect(xml).not.toContain('https://www.flycatchtech.com/services/</loc>');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toHaveLength(3);
  });
});
