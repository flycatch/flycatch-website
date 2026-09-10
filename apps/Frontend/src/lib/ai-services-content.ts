import type { PublicAiService, PublicSolutionDetail } from './public-api';

const hoverTitle = 'Cutting-Edge Expertise';
const hoverBody =
  'We’re revolutionizing healthcare with smarter care, retail with tailored experiences, finance with fraud detection, manufacturing with automation, and logistics with optimized operations. Wherever you are, AI is redefining possibilities.';

function designedSolution(
  title: string,
  slug: string,
  image: string,
): PublicSolutionDetail {
  return {
    title,
    slug,
    banner: {
      image_key: image,
      title,
      sub_title: '',
      industry_type: '',
    },
    introduction: {
      sub_title: hoverTitle,
      description: hoverBody,
    },
  };
}

function filled(value: string | null | undefined, fallback: string): string {
  const next = value?.trim();
  return next ? next : fallback;
}

export function designedAiService(): PublicAiService {
  return {
    slug: 'ai-services',
    banner_title: 'Transform Your Business with Cutting-Edge AI Solutions',
    banner_image_key: '/ai-services/hero.jpg',
    introduction_title: 'Offering best services',
    introduction_description:
      'Harness the potential of artificial intelligence and machine learning to revolutionize your business and lead the way in innovation. Our end-to-end AI and ML services support a wide range of industries in boosting their business competitiveness through smart solutions specific to their requirements.',
    solutions_title: 'Smart Solutions for Your Business',
    solutions_description:
      'Explore the huge potential of AI and ML to transform your business and be a market trend setter with our tailored services offerings for various departments and industries.',
    industry_title: 'Industries We’re Transforming',
    industry_description:
      'We’re revolutionizing healthcare with smarter care, retail with tailored experiences, finance with fraud detection, manufacturing with automation, and logistics with optimized operations. Wherever you are, AI is redefining possibilities.',
    industry_items: [
      { title: 'Healthcare', image_key: '/ai-services/industry-healthcare.jpg', order: 0 },
      { title: 'Retail', image_key: '/ai-services/industry-retail.jpg', order: 1 },
      { title: 'Finance', image_key: '/ai-services/industry-finance.jpg', order: 2 },
      { title: 'Manufacturing', image_key: '/ai-services/industry-manufacturing.jpg', order: 3 },
      { title: 'Logistics', image_key: '/ai-services/industry-logistics.jpg', order: 4 },
    ],
    ai_expertise_title: 'Immerse yourself in the Realm Augmented by AI Expertise',
    ai_expertise_image_key: '/ai-services/expertise.jpg',
    ai_expertise_accordion: [
      { title: 'Agentic AI', contents: '', order: 0 },
      { title: 'Enterprise GPT', contents: '', order: 1 },
      { title: 'Conversational AI', contents: '', order: 2 },
      { title: 'Knowledge AI', contents: '', order: 3 },
    ],
    ai_expertise_accordion_description:
      "We're transforming healthcare with smarter care, retail with personalized experiences, finance with fraud prevention, manufacturing with automation, and logistics with streamlined operations. Wherever you are, we are expanding the possibilities with AI.",
    solutions: [
      designedSolution('DoctCare AI', 'doctcare-ai', '/ai-services/solution-doctcare.jpg'),
      designedSolution('Talkshop AI', 'talkshop-ai', '/ai-services/solution-talkshop.jpg'),
      designedSolution('FlyGrid AI', 'flygrid-ai', '/ai-services/solution-flygrid.jpg'),
      designedSolution('DocSist AI', 'docsist-ai', '/ai-services/solution-docsist.jpg'),
    ],
    faq_title: '',
    faq_description: '',
    faq_accordion: [],
    seo: {
      title: 'AI Services',
      description:
        'Harness the potential of artificial intelligence and machine learning to revolutionize your business.',
      canonical_url: '/services/ai-services',
      meta_title: 'AI Services',
      h1_tag: 'Transform Your Business with Cutting-Edge AI Solutions',
      image_alt: 'Transform Your Business with Cutting-Edge AI Solutions',
      image_key: null,
    },
  };
}

export function aiServicePage(published: PublicAiService | null): PublicAiService {
  const designed = designedAiService();
  if (!published) return designed;
  return {
    ...designed,
    slug: filled(published.slug, designed.slug),
    banner_title: filled(published.banner_title, designed.banner_title),
    banner_image_key: published.banner_image_key || designed.banner_image_key,
    introduction_title: filled(published.introduction_title, designed.introduction_title),
    introduction_description: filled(
      published.introduction_description,
      designed.introduction_description,
    ),
    solutions_title: filled(published.solutions_title, designed.solutions_title),
    solutions_description: filled(
      published.solutions_description,
      designed.solutions_description,
    ),
    industry_title: filled(published.industry_title, designed.industry_title),
    industry_description: filled(published.industry_description, designed.industry_description),
    industry_items: published.industry_items?.length
      ? published.industry_items
      : designed.industry_items,
    ai_expertise_title: filled(published.ai_expertise_title, designed.ai_expertise_title),
    ai_expertise_image_key: published.ai_expertise_image_key || designed.ai_expertise_image_key,
    ai_expertise_accordion: published.ai_expertise_accordion?.length
      ? published.ai_expertise_accordion
      : designed.ai_expertise_accordion,
    ai_expertise_accordion_description: filled(
      published.ai_expertise_accordion_description,
      designed.ai_expertise_accordion_description,
    ),
    solutions: published.solutions?.length ? published.solutions : designed.solutions,
    faq_title: published.faq_title,
    faq_description: published.faq_description,
    faq_accordion: published.faq_accordion,
    seo: {
      title: filled(published.seo?.title, designed.seo.title),
      description: filled(published.seo?.description, designed.seo.description),
      canonical_url: filled(published.seo?.canonical_url, designed.seo.canonical_url),
      meta_title: filled(published.seo?.meta_title, designed.seo.meta_title),
      h1_tag: filled(published.seo?.h1_tag, designed.seo.h1_tag),
      image_alt: filled(published.seo?.image_alt, designed.seo.image_alt),
      image_key: published.seo?.image_key ?? designed.seo.image_key,
    },
  };
}
