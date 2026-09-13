import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  absoluteMediaUrl,
  apiOrigin,
  fetchOrigin,
  loadPublishedAiService,
  loadPublishedAiServices,
  loadPublishedBlog,
  loadPublishedBlogs,
  loadPublishedHomes,
  publishedBlogSlugCandidates,
  publicApiFetchedUrls,
  publicMediaUrl,
  resetPublicApiCache,
} from '../../src/lib/public-api';

afterEach(() => {
  resetPublicApiCache();
  vi.unstubAllGlobals();
});

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

describe('public AI service field mapping', () => {
  it('returns published detail fields without substituting designed content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
        solutions: [
          {
            title: 'DoctCare AI',
            slug: 'doctcare-ai',
            banner: { image_key: null, title: '', sub_title: '', industry_type: '' },
            introduction: { sub_title: '', description: '' },
            solutions_section: {
              title: 'DoctCare AI',
              image_key: 'solutions/doctcare.jpg',
              description: 'Hover copy',
            },
          },
        ],
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
    const result = await loadPublishedAiService('cms-ai');
    expect(result.error).toBe(false);
    expect(result.item?.banner_title).toBe('CMS title');
    expect(result.item?.banner_image_key).toBeNull();
    expect(result.item?.introduction_title).toBe('');
    expect(result.item?.industry_items).toHaveLength(0);
    expect(result.item?.solutions[0].solutions_section.title).toBe('DoctCare AI');
    expect(result.item?.solutions[0].solutions_section.image_key).toBe('solutions/doctcare.jpg');
    vi.unstubAllGlobals();
  });
});

describe('published blog slug lookup', () => {
  it('retries a legacy 128-character slug when the production slug is longer', async () => {
    const full =
      'explore-practical-cloud-migration-strategies-that-enhance-scalability-security-and-performance-learn-how-to-plan-execute-and-optimize-your-move-to-the-cloud';
    expect(publishedBlogSlugCandidates(full)).toEqual([full, full.slice(0, 128)]);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ slug: full.slice(0, 128), title: 'Cloud migration' }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedBlog(full);
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe(full.slice(0, 128));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});

describe('CMS request efficiency', () => {
  it('fetches the same CMS resource only once in a render', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([loadPublishedHomes(), loadPublishedHomes()]);

    expect(first.error).toBe(false);
    expect(second.error).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(publicApiFetchedUrls()).toHaveLength(1);
    expect(publicApiFetchedUrls()[0]).toContain('/api/v1/public/homes');
  });

  it('requests only as many blog summaries as the page will render', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { title: 'One', slug: 'one' },
          { title: 'Two', slug: 'two' },
          { title: 'Three', slug: 'three' },
        ],
        page: 1,
        per_page: 3,
        total: 82,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadPublishedBlogs({ maxItems: 3 });

    expect(result.items).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('per_page=3');
    expect(String(fetchMock.mock.calls[0][0])).toContain('page=1');
  });
});

