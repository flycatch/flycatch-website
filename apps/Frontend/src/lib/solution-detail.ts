export type SolutionDetailProduct = {
  apiSlug: string;
  pathSlug: string;
  titleKey: string;
};

export const SOLUTION_DETAIL_PRODUCTS: SolutionDetailProduct[] = [
  { apiSlug: 'doctcare-ai', pathSlug: 'doctCare-ai', titleKey: 'page.doctcare.title' },
  { apiSlug: 'docsis-ai', pathSlug: 'docSis-ai', titleKey: 'page.docsis.title' },
  { apiSlug: 'talkshop-ai', pathSlug: 'talkShop-ai', titleKey: 'page.talkshop.title' },
  { apiSlug: 'flygrid-ai', pathSlug: 'flyGrid-ai', titleKey: 'page.flygrid.title' },
];

export function resolveSolutionDetailRoute(
  param: string | undefined,
): SolutionDetailProduct | null {
  const key = (param ?? '').trim().toLowerCase();
  if (!key) return null;
  return (
    SOLUTION_DETAIL_PRODUCTS.find(
      (product) => product.apiSlug === key || product.pathSlug.toLowerCase() === key,
    ) ?? null
  );
}

export function solutionDetailPath(product: SolutionDetailProduct): string {
  return `/solutions/${product.pathSlug}`;
}

export function solutionDetailByPathSlug(pathSlug: string): SolutionDetailProduct {
  const product = SOLUTION_DETAIL_PRODUCTS.find((item) => item.pathSlug === pathSlug);
  if (!product) {
    throw new Error(`Unknown solution detail path: ${pathSlug}`);
  }
  return product;
}
