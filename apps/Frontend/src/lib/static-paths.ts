import productionUrls from '../../../../openspec/changes/migrate-flycatch-website/baseline/production-urls.json';
import { PRODUCTION_SERVICE_SLUGS, PRODUCTION_SOLUTION_SLUGS } from './page-catalog';
import {
  loadPublishedBlogs,
  loadPublishedCaseStudies,
  loadPublishedNews,
  loadPublishedOpenings,
  loadPublishedResources,
  type PublicListResult,
} from './public-api';

export type SlugStaticPath = { params: { slug: string } };

type BaselineFile = {
  urls?: { path?: string }[];
};

export function baselineInventoryPaths(data: BaselineFile = productionUrls): string[] {
  return (data.urls ?? [])
    .map((entry) => (entry.path === '' ? '/' : entry.path ?? ''))
    .filter(Boolean);
}

export function baselineSlugsUnder(prefix: string, paths = baselineInventoryPaths()): string[] {
  const withSlash = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return paths
    .filter((path) => path.startsWith(withSlash))
    .map((path) => path.slice(withSlash.length))
    .filter((slug) => slug.length > 0 && !slug.includes('/'));
}

function slugPaths(slugs: readonly string[]): SlugStaticPath[] {
  return slugs.map((slug) => ({ params: { slug } }));
}

function listedSlugs<T extends { slug: string }>(
  result: PublicListResult<T>,
  label: string,
): string[] {
  if (result.error) {
    console.warn(`static-paths: ${label} were not fully available from the public API`);
  }
  return result.items.map((item) => item.slug).filter(Boolean);
}

function mergeSlugs(...groups: string[][]): string[] {
  return [...new Set(groups.flat().filter(Boolean))];
}

export function serviceStaticPaths(): SlugStaticPath[] {
  return slugPaths(PRODUCTION_SERVICE_SLUGS.filter((slug) => slug !== 'ai-services'));
}

export function solutionStaticPaths(): SlugStaticPath[] {
  return slugPaths(PRODUCTION_SOLUTION_SLUGS);
}

export async function blogStaticPaths(): Promise<SlugStaticPath[]> {
  return slugPaths(
    mergeSlugs(
      listedSlugs(await loadPublishedBlogs(), 'published blogs'),
      baselineSlugsUnder('/company/blogs'),
    ),
  );
}

export async function caseStudyStaticPaths(): Promise<SlugStaticPath[]> {
  return slugPaths(
    mergeSlugs(
      listedSlugs(await loadPublishedCaseStudies(), 'published case studies'),
      baselineSlugsUnder('/case-studies'),
    ),
  );
}

export async function openingStaticPaths(): Promise<SlugStaticPath[]> {
  return slugPaths(
    mergeSlugs(
      listedSlugs(await loadPublishedOpenings(), 'published openings'),
      baselineSlugsUnder('/company/jobs-openings'),
      ['contract'],
    ),
  );
}

export async function newsStaticPaths(): Promise<SlugStaticPath[]> {
  return slugPaths(
    mergeSlugs(
      listedSlugs(await loadPublishedNews(), 'published news'),
      baselineSlugsUnder('/company/news-and-events'),
    ),
  );
}

export async function resourceStaticPaths(): Promise<SlugStaticPath[]> {
  return slugPaths(
    mergeSlugs(
      listedSlugs(await loadPublishedResources(), 'published resources'),
      baselineSlugsUnder('/company/resources'),
    ),
  );
}
