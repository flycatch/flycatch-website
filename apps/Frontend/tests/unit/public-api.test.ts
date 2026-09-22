import { describe, expect, it, vi } from 'vitest';
import {
  absoluteMediaUrl,
  apiOrigin,
  fetchOrigin,
  loadPublishedAiService,
  loadPublishedAiServices,
  loadPublishedMobileApplicationDevelopment,
  loadPublishedMobileApplicationDevelopments,
  loadPublishedApplicationDevelopment,
  loadPublishedApplicationDevelopments,
  loadPublishedApplicationModernization,
  loadPublishedApplicationModernizations,
  loadPublishedUserCenteredDesign,
  loadPublishedUserCenteredDesigns,
  loadPublishedCloudService,
  loadPublishedCloudServices,
  loadPublishedDataAnalytic,
  loadPublishedDataAnalytics,
  loadPublishedDigitalTransformation,
  loadPublishedDigitalTransformations,
  loadPublishedOverview,
  loadPublishedOverviews,
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


describe('public mobile application development loaders', () => {
  it('lists published entries from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: 'mobile-application-development',
            banner_title: 'Mobile',
            banner_image_key: null,
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedMobileApplicationDevelopments();
    expect(result.error).toBe(false);
    expect(result.items[0].slug).toBe('mobile-application-development');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/mobile-application-development',
    );
    vi.unstubAllGlobals();
  });

  it('loads published detail by slug without substituting designed content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'mobile-application-development',
        banner_title: 'CMS banner',
        banner_image_key: 'mad/hero.jpg',
        introduction_title: 'CMS intro',
        introduction_first_paragraph: 'First',
        introduction_second_paragraph: 'Second',
        introduction_third_paragraph: 'Third',
        accordion: [{ title: 'Native', contents: '<p>Body</p>', order: 0 }],
        offering_image_key: 'mad/offering.jpg',
        offering_title: 'CMS offering',
        offering_description: '<p>Offering</p>',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'Top Mobile App Development Companies & Service in Saudi Arabia',
          description: '',
          canonical_url: '/services/mobile-application-development',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedMobileApplicationDevelopment(
      'mobile-application-development',
    );
    expect(result.error).toBe(false);
    expect(result.item?.banner_title).toBe('CMS banner');
    expect(result.item?.banner_image_key).toBe('mad/hero.jpg');
    expect(result.item?.introduction_third_paragraph).toBe('Third');
    expect(result.item?.accordion).toHaveLength(1);
    expect(result.item?.offering_title).toBe('CMS offering');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/mobile-application-development/mobile-application-development',
    );
    vi.unstubAllGlobals();
  });
});

describe('public application development loaders', () => {
  it('lists published application development pages from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: 'best-app-development-company-for-enterprise-solutions',
            banner_title: 'Best App Development Company for Enterprise Solutions',
            banner_image_key: '1de875c802c3416b89ba35d66cf36f64.webp',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedApplicationDevelopments();
    expect(result.error).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('best-app-development-company-for-enterprise-solutions');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/application-development');
    vi.unstubAllGlobals();
  });

  it('loads a published application development page by slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'best-app-development-company-for-enterprise-solutions',
        banner_title: 'Best App Development Company for Enterprise Solutions',
        banner_image_key: '1de875c802c3416b89ba35d66cf36f64.webp',
        introduction_title: 'Engineer Modern Digital Systems for Business',
        introduction_first_paragraph: 'First',
        introduction_second_paragraph: 'Second',
        accordion: [],
        offering_image_key: '5c8957bbff214a478966dadb005fee32.webp',
        offering_title: 'What We Offer?',
        offering_description: '<p>Offer</p>',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        content_available_in: ['en'],
        seo: {
          title: 'Best App Development Companies',
          description: '',
          canonical_url: '/services/application-development-services',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedApplicationDevelopment(
      'best-app-development-company-for-enterprise-solutions',
    );
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe('best-app-development-company-for-enterprise-solutions');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/application-development/best-app-development-company-for-enterprise-solutions',
    );
    vi.unstubAllGlobals();
  });
});

describe('public application development field mapping', () => {
  it('returns published detail fields without substituting designed content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'cms-ads',
        banner_title: 'CMS title',
        banner_image_key: null,
        introduction_title: '',
        introduction_first_paragraph: '',
        introduction_second_paragraph: '',
        accordion: [{ title: 'One', contents: '<p>Body</p>', order: 2 }],
        offering_image_key: null,
        offering_title: '',
        offering_description: '',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        content_available_in: ['en'],
        seo: {
          title: 'ADS',
          description: '',
          canonical_url: '/services/application-development-services',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedApplicationDevelopment('cms-ads');
    expect(result.error).toBe(false);
    expect(result.item?.banner_title).toBe('CMS title');
    expect(result.item?.banner_image_key).toBeNull();
    expect(result.item?.introduction_title).toBe('');
    expect(result.item?.offering_title).toBe('');
    expect(result.item?.accordion).toHaveLength(1);
    expect(result.item?.faq_accordion).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});

describe('public application modernization loaders', () => {
  it('lists published application modernization pages from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: 'application-modernization',
            banner_title: 'Application Modernization Service',
            banner_image_key: 'modernization/banner.webp',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedApplicationModernizations();
    expect(result.error).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('application-modernization');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/application-modernization',
    );
    vi.unstubAllGlobals();
  });

  it('loads a published application modernization page by slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'application-modernization',
        banner_title: 'Application Modernization Service',
        banner_image_key: 'modernization/banner.webp',
        introduction_title: 'Intro',
        introduction_first_paragraph: 'First',
        introduction_second_paragraph: 'Second',
        accordion: [],
        offering_image_key: 'modernization/offer.webp',
        offering_title: 'What We Offer?',
        offering_description: '<p>Offer</p>',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'Application Modernization Service | Flycatch',
          description: '',
          canonical_url: '/services/application-modernization',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedApplicationModernization('application-modernization');
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe('application-modernization');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/application-modernization/application-modernization',
    );
    vi.unstubAllGlobals();
  });
});

describe('public application modernization field mapping', () => {
  it('returns published detail fields without substituting designed content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'cms-modernization',
        banner_title: 'CMS title',
        banner_image_key: null,
        introduction_title: '',
        introduction_first_paragraph: '',
        introduction_second_paragraph: '',
        accordion: [{ title: 'One', contents: '<p>Body</p>', order: 2 }],
        offering_image_key: null,
        offering_title: '',
        offering_description: '',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'Modernization',
          description: '',
          canonical_url: '/services/application-modernization',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedApplicationModernization('cms-modernization');
    expect(result.error).toBe(false);
    expect(result.item?.banner_title).toBe('CMS title');
    expect(result.item?.banner_image_key).toBeNull();
    expect(result.item?.introduction_title).toBe('');
    expect(result.item?.offering_title).toBe('');
    expect(result.item?.accordion).toHaveLength(1);
    expect(result.item?.faq_accordion).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});

describe('public user-centered design loaders', () => {
  it('lists published user-centered design pages from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: 'user-centered-design',
            banner_title: 'User-Centered Design Services',
            banner_image_key: 'ucd/banner.webp',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedUserCenteredDesigns();
    expect(result.error).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('user-centered-design');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/user-centered-design');
    vi.unstubAllGlobals();
  });

  it('loads a published user-centered design page by slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'user-centered-design',
        banner_title: 'User-Centered Design Services',
        banner_image_key: 'ucd/banner.webp',
        introduction_title: 'Intro',
        introduction_first_paragraph: 'First',
        introduction_second_paragraph: 'Second',
        accordion: [],
        offering_image_key: 'ucd/offer.webp',
        offering_title: 'What We Offer?',
        offering_description: '<p>Offer</p>',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'User-Centered Design Services | Flycatch',
          description: '',
          canonical_url: '/services/user-centered-design',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedUserCenteredDesign('user-centered-design');
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe('user-centered-design');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/user-centered-design/user-centered-design',
    );
    vi.unstubAllGlobals();
  });
});

describe('public user-centered design field mapping', () => {
  it('returns published detail fields without substituting designed content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'cms-ucd',
        banner_title: 'CMS title',
        banner_image_key: null,
        introduction_title: '',
        introduction_first_paragraph: '',
        introduction_second_paragraph: '',
        accordion: [{ title: 'One', contents: '<p>Body</p>', order: 2 }],
        offering_image_key: null,
        offering_title: '',
        offering_description: '',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'User Centered Design',
          description: '',
          canonical_url: '/services/user-centered-design',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedUserCenteredDesign('cms-ucd');
    expect(result.error).toBe(false);
    expect(result.item?.banner_title).toBe('CMS title');
    expect(result.item?.banner_image_key).toBeNull();
    expect(result.item?.introduction_title).toBe('');
    expect(result.item?.offering_title).toBe('');
    expect(result.item?.accordion).toHaveLength(1);
    expect(result.item?.faq_accordion).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});

describe('public cloud services loaders', () => {
  it('lists published cloud services from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            page_name: 'cloud-migration',
            banner_title: 'Cloud Migration Services',
            banner_image_key: 'cloud/banner.webp',
            introduction_title: 'Intro',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedCloudServices();
    expect(result.error).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].page_name).toBe('cloud-migration');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/cloud-services');
    vi.unstubAllGlobals();
  });

  it('loads a published cloud service by page_name', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        page_name: 'cloud-migration',
        banner_title: 'Cloud Migration Services',
        banner_image_key: 'cloud/banner.webp',
        introduction_title: 'Intro',
        introduction_first_paragraph: 'First',
        introduction_second_paragraph: 'Second',
        accordion: [],
        offering_image_key: 'cloud/offer.webp',
        offering_title: 'What We Offer?',
        offering_description: '<p>Offer</p>',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'Cloud Migration Services',
          description: '',
          canonical_url: '/services/cloud-migration',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedCloudService('cloud-migration');
    expect(result.error).toBe(false);
    expect(result.item?.page_name).toBe('cloud-migration');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/cloud-services/cloud-migration',
    );
    vi.unstubAllGlobals();
  });

  it('returns published detail fields without substituting designed content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        page_name: 'cloud-services',
        banner_title: 'CMS title',
        banner_image_key: null,
        introduction_title: '',
        introduction_first_paragraph: '',
        introduction_second_paragraph: '',
        accordion: [{ title: 'One', contents: '<p>Body</p>', order: 2 }],
        offering_image_key: null,
        offering_title: '',
        offering_description: '',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'Cloud',
          description: '',
          canonical_url: '/services/cloud-migration',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedCloudService('cloud-services');
    expect(result.error).toBe(false);
    expect(result.item?.banner_title).toBe('CMS title');
    expect(result.item?.banner_image_key).toBeNull();
    expect(result.item?.introduction_title).toBe('');
    expect(result.item?.offering_title).toBe('');
    expect(result.item?.accordion).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});

describe('public data analytics loaders', () => {
  it('lists published data analytics pages from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            page_name: 'data-migration',
            banner_title: 'Data Migration Services',
            banner_image_key: 'data/banner.webp',
            introduction_title: 'Intro',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedDataAnalytics();
    expect(result.error).toBe(false);
    expect(result.items[0].page_name).toBe('data-migration');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/data-analytics');
    vi.unstubAllGlobals();
  });

  it('loads a published data analytics page by page_name', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        page_name: 'data-migration',
        banner_title: 'Best Data Analytics Company in Saudi Arabia',
        banner_image_key: 'data/banner.webp',
        introduction_title: 'Intro',
        introduction_first_paragraph: 'First',
        introduction_second_paragraph: 'Second',
        accordion: [],
        offering_image_key: null,
        offering_title: '',
        offering_description: '',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'Data Migration Services',
          description: '',
          canonical_url: '/services/data-migration',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedDataAnalytic('data-migration');
    expect(result.error).toBe(false);
    expect(result.item?.page_name).toBe('data-migration');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/data-analytics/data-migration',
    );
    vi.unstubAllGlobals();
  });
});

describe('public digital transformation loaders', () => {
  it('lists published digital transformation pages from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: 'digital-transformation',
            banner_title: 'Digital Transformation Services',
            banner_image_key: 'dt/banner.webp',
            banner_tag_line: 'Transform now',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedDigitalTransformations();
    expect(result.error).toBe(false);
    expect(result.items[0].slug).toBe('digital-transformation');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/digital-transformation');
    vi.unstubAllGlobals();
  });

  it('loads a published digital transformation page by slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'digital-transformation',
        banner_title: 'Digital Transformation Services',
        banner_image_key: 'dt/banner.webp',
        banner_tag_line: 'Tag',
        introduction_title: 'Intro',
        introduction_first_paragraph: 'First',
        introduction_second_paragraph: 'Second',
        accordion: [],
        outcomes_image_key: 'dt/outcomes.webp',
        outcomes_title: 'Outcomes',
        outcomes_description: '<p>Outcomes</p>',
        faq_title: '',
        faq_description: '',
        faq_accordion: [],
        seo: {
          title: 'Digital Transformation Service in Saudi Arabia',
          description: '',
          canonical_url: '/services/digital-transformation',
          meta_title: '',
          h1_tag: '',
          image_alt: '',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedDigitalTransformation('digital-transformation');
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe('digital-transformation');
    expect(result.item?.outcomes_title).toBe('Outcomes');
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/v1/public/digital-transformation/digital-transformation',
    );
    vi.unstubAllGlobals();
  });
});

describe('public overview loaders', () => {
  it('lists published overviews from the public API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: 'services',
            banner_title: 'Visualization Services in Saudi | Canada | UK | UAE',
            banner_image_key: 'overview/banner.webp',
          },
        ],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedOverviews();
    expect(result.error).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('services');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/overview');
    vi.unstubAllGlobals();
  });

  it('loads a published overview by slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'services',
        banner_title: 'Visualization Services in Saudi | Canada | UK | UAE',
        banner_image_key: 'overview/banner.webp',
        introduction_title: '',
        introduction_first_paragraph: '',
        introduction_second_paragraph: '',
        seo: {
          title: 'Services | Flycatch',
          description: 'Discover expert visualization services',
          canonical_url: '/services',
          meta_title: '',
          h1_tag: 'Visualization Services in Saudi | Canada | UK | UAE',
          image_alt: 'Visualization Services in Saudi',
          image_key: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPublishedOverview('services');
    expect(result.error).toBe(false);
    expect(result.item?.slug).toBe('services');
    expect(result.item?.banner_title).toBe(
      'Visualization Services in Saudi | Canada | UK | UAE',
    );
    expect(result.item?.introduction_title).toBe('');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/overview/services');
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

