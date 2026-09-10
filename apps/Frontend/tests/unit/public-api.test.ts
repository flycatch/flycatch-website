import { describe, expect, it, vi } from 'vitest';
import {
  absoluteMediaUrl,
  apiOrigin,
  fetchOrigin,
  loadPublishedAiService,
  loadPublishedAiServices,
  publicMediaUrl,
} from '../../src/lib/public-api';

describe('public media URLs', () => {
  it('encodes object keys', () => {
    expect(publicMediaUrl('homes/hero video.mp4')).toBe(
      '/api/v1/public/media/homes%2Fhero%20video.mp4',
    );
    expect(publicMediaUrl(null)).toBeNull();
    expect(publicMediaUrl('/ai-services/hero.jpg')).toBe('/ai-services/hero.jpg');
  });

  it('builds absolute media URLs for Open Graph', () => {
    expect(absoluteMediaUrl('http://localhost:8080', 'cover.png')).toBe(
      'http://localhost:8080/api/v1/public/media/cover.png',
    );
  });

  it('uses API_ORIGIN for server-side fetches when set', () => {
    const previous = process.env.API_ORIGIN;
    process.env.API_ORIGIN = 'http://backend:8000';
    expect(fetchOrigin()).toBe('http://backend:8000');
    expect(apiOrigin()).not.toBe('http://backend:8000');
    if (previous === undefined) delete process.env.API_ORIGIN;
    else process.env.API_ORIGIN = previous;
  });
});

describe('public AI services loaders', () => {
  it('lists published AI services from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: 'ai-services',
            banner_title: 'AI',
            banner_image_key: null,
            introduction_title: 'Intro',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedAiServices();
    expect(result.error).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('ai-services');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/ai-services');
    vi.unstubAllGlobals();
  });

  it('loads a published AI service by slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'ai-services',
        banner_title: 'AI',
        banner_image_key: null,
        introduction_title: 'Intro',
        introduction_description: 'Body',
        solutions_title: '',
        solutions_description: '',
        industry_title: '',
        industry_description: '',
        industry_items: [],
        ai_expertise_title: '',
        ai_expertise_image_key: null,
        ai_expertise_accordion: [],
        ai_expertise_accordion_description: '',
        solutions: [],
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'AI Services',
          description: '',
          canonical_url: '/services/ai-services',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedAiService('ai-services');
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe('ai-services');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/ai-services/ai-services');
    vi.unstubAllGlobals();
  });
});

describe('AI services designed fallback', () => {
  it('fills empty published fields from the designed page', async () => {
    const { aiServicePage } = await import('../../src/lib/ai-services-content');
    const page = aiServicePage({
      slug: 'cms-ai',
      banner_title: 'CMS title',
      banner_image_key: null,
      introduction_title: '',
      introduction_description: '',
      solutions_title: '',
      solutions_description: '',
      industry_title: '',
      industry_description: '',
      industry_items: [],
      ai_expertise_title: '',
      ai_expertise_image_key: null,
      ai_expertise_accordion: [],
      ai_expertise_accordion_description: '',
      solutions: [],
      faq_title: '',
      faq_description: '',
      faq_accordion: [],
      seo: {
        title: '',
        description: '',
        canonical_url: '',
        meta_title: '',
        h1_tag: '',
        image_alt: '',
        image_key: null,
      },
    });
    expect(page.slug).toBe('cms-ai');
    expect(page.banner_title).toBe('CMS title');
    expect(page.banner_image_key).toBe('/ai-services/hero.jpg');
    expect(page.introduction_title).toBe('Offering best services');
    expect(page.solutions).toHaveLength(4);
    expect(page.industry_items).toHaveLength(5);
  });
});

