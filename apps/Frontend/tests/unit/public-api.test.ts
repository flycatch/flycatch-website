import { describe, expect, it, vi } from 'vitest';
import {
  absoluteMediaUrl,
  apiOrigin,
  fetchOrigin,
  loadPublishedAiService,
  loadPublishedAiServices,
  cmsRichContent,
  loadPublishedSolutionDetail,
  loadPublishedSolutionProduct,
  loadPublishedSolutionProducts,
  loadPublishedSolutions,
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

describe('public solutions loaders', () => {
  it('lists published solutions from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            banner_image_key: 'solutions/hero.jpg',
            banner_title: 'We help companies all around the world to grow',
            section_title: 'Our Products',
            seo: {
              title: 'Solutions',
              description: '',
              canonical_url: '/solutions',
              meta_title: '',
              h1_tag: '',
              image_alt: '',
              image_key: null,
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedSolutions();
    expect(result.error).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].section_title).toBe('Our Products');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/solutions');
    vi.unstubAllGlobals();
  });

  it('loads a published solution product by slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        product_title: 'Credit Life',
        product_description: 'Census management',
        product_tag: 'Insurance',
        product_logo_key: null,
        product_card_image_key: 'products/credit-life.jpg',
        product_banner_image_key: null,
        card_image_on_right: true,
        banner_image_on_right: false,
        slug: 'credit-life',
        order: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedSolutionProduct('credit-life');
    expect(result.error).toBe(false);
    expect(result.item?.product_title).toBe('Credit Life');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/solution-products/credit-life',
    );
    vi.unstubAllGlobals();
  });

  it('hydrates listed products from the slug endpoint and sorts by order', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const href = String(url);
      if (href.includes('/api/v1/public/solution-products?')) {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                slug: 'combus',
                product_title: 'ComBus',
                product_description: '',
                product_tag: '',
                product_logo_key: null,
                product_card_image_key: null,
                card_image_on_right: false,
                order: 2,
              },
              {
                slug: 'credit-life',
                product_title: 'Credit Life',
                product_description: '',
                product_tag: '',
                product_logo_key: null,
                product_card_image_key: null,
                card_image_on_right: true,
                order: 1,
              },
            ],
            page: 1,
            per_page: 10,
            total: 2,
          }),
        };
      }
      if (href.endsWith('/solution-products/combus')) {
        return {
          ok: true,
          json: async () => ({
            product_title: 'ComBus',
            product_description: 'Body',
            product_tag: 'Insurance',
            product_logo_key: null,
            product_card_image_key: 'products/combus.jpg',
            product_banner_image_key: null,
            card_image_on_right: false,
            banner_image_on_right: false,
            slug: 'combus',
            order: 2,
          }),
        };
      }
      if (href.endsWith('/solution-products/credit-life')) {
        return {
          ok: true,
          json: async () => ({
            product_title: 'Credit Life',
            product_description: 'Body',
            product_tag: 'Insurance',
            product_logo_key: null,
            product_card_image_key: 'products/credit-life.jpg',
            product_banner_image_key: null,
            card_image_on_right: true,
            banner_image_on_right: false,
            slug: 'credit-life',
            order: 1,
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedSolutionProducts();
    expect(result.error).toBe(false);
    expect(result.items.map((item) => item.slug)).toEqual(['credit-life', 'combus']);
    expect(result.items[0].card_image_on_right).toBe(true);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/solution-products?'))).toBe(
      true,
    );
    expect(
      fetchMock.mock.calls.some((call) =>
        String(call[0]).includes('/api/v1/public/solution-products/credit-life'),
      ),
    ).toBe(true);
    vi.unstubAllGlobals();
  });
});

describe('public solution details loader', () => {
  it('loads a published solution detail by slug without substituting designed copy', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'doctCare-ai',
        slug: 'doctcare-ai',
        banner: {
          image_key: 'banner.webp',
          title: 'CMS banner title',
          sub_title: 'Industry',
          industry_type: 'Clinical Workflow Automation',
        },
        introduction: {
          items: [{ title: 'DoctCare AI', order: 2, color: '#E50914' }],
          description: 'CMS intro',
          icon_keys: ['icon.webp'],
          sub_title: 'CMS card title',
          sub_description: '<p>CMS card body</p>',
          image_key: 'intro.webp',
        },
        challenges: {
          items: [{ title: 'Challenges', order: 1, color: '#E50914' }],
          description: '<p>CMS quote</p>',
          image_key: 'person.webp',
          name: 'CMS name',
          position: 'CMS role',
          types: [
            {
              image_key: 'type.webp',
              title: 'Administrative Overload',
              description: '<p>CMS type</p>',
              order: 1,
            },
          ],
        },
        benefits: {
          items: [{ title: 'DoctCare AI', order: 1, color: '#E50914' }],
          description: 'CMS benefits',
          types: [
            {
              image_key: 'benefit.webp',
              title: 'Frictionless Implementation',
              description:
                "[{'type': 'paragraph', 'children': [{'text': 'CMS benefit copy', 'type': 'text'}]}]",
              order: 1,
            },
          ],
        },
        solutions_section: { title: '', image_key: null, description: '' },
        cta: {
          title: 'CMS cta title',
          description: 'CMS cta body',
          button_name: 'Book a call',
        },
        seo: {
          title: '',
          description: '',
          canonical_url: '',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedSolutionDetail('doctcare-ai');
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe('doctcare-ai');
    expect(result.item?.banner.title).toBe('CMS banner title');
    expect(result.item?.introduction.items[0].title).toBe('DoctCare AI');
    expect(result.item?.challenges.types[0].title).toBe('Administrative Overload');
    expect(result.item?.benefits.types[0].title).toBe('Frictionless Implementation');
    expect(result.item?.cta.title).toBe('CMS cta title');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/solution-details/doctcare-ai',
    );
    expect(cmsRichContent(result.item?.benefits.types[0].description).text).toBe('CMS benefit copy');
    vi.unstubAllGlobals();
  });

  it('requests each published solution-detail slug from the same public contract', async () => {
    const slugs = ['doctcare-ai', 'docsis-ai', 'talkshop-ai', 'flygrid-ai'];
    for (const slug of slugs) {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: slug,
          slug,
          banner: { image_key: null, title: 'CMS banner', sub_title: '', industry_type: '' },
          introduction: {
            items: [],
            description: '',
            icon_keys: [],
            sub_title: '',
            sub_description: '',
            image_key: null,
          },
          challenges: {
            items: [],
            description: '',
            image_key: null,
            name: '',
            position: '',
            types: [],
          },
          benefits: { items: [], description: '', types: [] },
          solutions_section: { title: '', image_key: null, description: '' },
          cta: { title: '', description: '', button_name: '' },
          seo: {
            title: '',
            description: '',
            canonical_url: '',
            meta_title: '',
            h1_tag: '',
            image_alt: '',
            image_key: null,
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);
      const result = await loadPublishedSolutionDetail(slug);
      expect(result.error).toBe(false);
      expect(result.item?.slug).toBe(slug);
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        `/api/v1/public/solution-details/${slug}`,
      );
      vi.unstubAllGlobals();
    }
  });
});

