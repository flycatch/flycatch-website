## Why

The production website at `https://www.flycatchtech.com` (Next.js 14 App Router + Strapi) has a defect at its centre that undermines the whole point of the site: **the content of 104 of its 139 indexable URLs is fetched client-side and is absent from the server-rendered HTML.** A blog post page delivers roughly 650 bytes of visible text — a header stub, a call to action, and the footer. The word "Kubernetes" appears exactly twice in the 131 KB document for the Kubernetes article, both times in the `<head>`. Every blog post, case study, and job opening is effectively contentless to a crawler that does not execute JavaScript, and the main navigation is client-rendered too, so crawlers see zero navigation links.

Layered on top of that: every HTML response is `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`, so no page is cacheable by any browser, proxy, or CDN — and there is no CDN, just a single DigitalOcean VM that also hosts Strapi. The home page has **no meta description**. Any nonexistent blog slug returns **HTTP 200** with a slug-derived title and a self-referencing canonical, creating unbounded indexable empty pages. The preloaded company logo is a **372 KB SVG**. Structured data is one static `Organization`/`LocalBusiness` block repeated identically on every page.

A replacement stack already exists in this repository — an Astro 5 SSR frontend (`apps/Frontend`), a FastAPI + PostgreSQL + S3 headless CMS (`apps/Backend`), and a staff admin UI (`apps/Administration-FE`) — but it currently implements **9 of the ~139 production URLs**, and several of the routes it does implement use different paths than production. Finishing that migration without a deliberate URL, SEO, and content-parity plan would lose the existing site's search rankings and backlinks.

This change plans the completion of that migration: reach production content/URL/functional parity on the new stack, migrate Strapi content into the FastAPI CMS, and launch with SEO equity preserved and Core Web Vitals treated as a production requirement.

## Scope decisions (confirmed with the requester)

1. **Strapi is legacy.** Content is migrated *into* the FastAPI CMS via an importer; the public site reads only from `/api/v1/public/*`. The Astro site will not call `cms.flycatchtech.com` at runtime.
2. **Production is the visual target.** The recent Figma-driven rework of the home page and the AI Services page is treated as a deviation to be reconciled back toward the production look, not as the new design baseline.
3. **One change** covers the whole migration, phased in `tasks.md`.
4. A Strapi read token will be supplied at implementation time; planning assumes the public REST API for published content and a token for drafts/media.

## 1. Current State

### 1.1 Production (`www.flycatchtech.com`)

| Attribute | Observed value |
| --- | --- |
| Framework | Next.js 14 App Router (`x-powered-by: Next.js`, `vary: RSC, Next-Router-State-Tree`, no `__NEXT_DATA__`) |
| UI library | Mantine; i18n via `next-intl` with an ~85 KB message dictionary inlined into every page for a single locale |
| CMS | Strapi v4 at `cms.flycatchtech.com`, queried **from the browser** (CSP also allows a second origin, `fly-strapi.flycatchtech.in`) |
| Hosting | nginx 1.27.2 on a single DigitalOcean host `68.183.85.169`; `cms.flycatchtech.com` resolves to the **same IP**; **no CDN** |
| Rendering | Marketing pages server-rendered; **blogs, case studies, job openings, and listing pages are client-rendered** (~600–850 bytes of visible text) |
| Caching | HTML `no-store`; `/public` assets `max-age=0`; `/_next/image` `max-age=60`; only `/_next/static/**` is `immutable` |
| Indexable URLs | 139 in `sitemap.xml` (single file, no index), all returning 200; `lastmod` is one shared build timestamp |
| Analytics | GTM `GTM-5SK96WK`, firing GA4 `G-G8VWZ0924F`, Hotjar site `1872525`, and Drift `p3d94p49we9d`; dead `UA-170193189-1` still configured |
| Forms | **Zero `<form>` elements site-wide**; all submissions are JS POSTs direct to Strapi, protected by reCAPTCHA v2 |
| Fonts | 4–5 self-hosted subset woff2 via `next/font` with `font-display: swap`; stale `preconnect` to Google Fonts that is never used |
| Home page | 193,438 bytes HTML (48 KB brotli), 33 JS chunks, 13 CSS files (7 render-blocking), ~1.42 MB total including the GTM container |
| Structured data | One static block repeated site-wide: `Organization` (empty `sameAs`), `LocalBusiness` ×2 |
| Security headers | HSTS preload, `X-Frame-Options: SAMEORIGIN`, CSP in **report-only** mode and missing the Drift and Hotjar hosts it actually loads |

### 1.2 This repository (`dev` branch)

A three-surface monorepo, not the Next.js stack production runs:

| Surface | Folder | Stack |
| --- | --- | --- |
| Public site | `apps/Frontend` | Astro 5.7 SSR (`output: 'server'`, `@astrojs/node` standalone), TypeScript, plain CSS custom properties, `@fontsource/poppins`, pnpm 9, Node 22 |
| Staff admin | `apps/Administration-FE` | Astro 5 + React 19 |
| CMS / API | `apps/Backend` | FastAPI, Python 3.12, PostgreSQL 16, S3/MinIO, Alembic (26 migrations, ~40 content tables) |

Notable frontend characteristics:

- All routes are on-demand SSR. Only `404.astro` sets `prerender = true`. There is no `getStaticPaths`, no ISR, and no build-time rendering of CMS pages.
- `src/middleware.ts` sets `Cache-Control: no-store` on **every** response, so the new site currently repeats production's worst caching behaviour.
- `src/lib/public-api.ts` is a clean, fully typed, centralized client with zero `any`. Public reads need no token, so no credential can leak to the browser.
- `fetch()` calls carry no cache options or revalidation tags; every page view hits the Backend.
- SEO is centralized in `BaseLayout.astro` + `src/lib/metadata.ts`: title, description, canonical, OG, Twitter, and a `noindex, nofollow` guard whenever `PUBLIC_ENVIRONMENT !== 'production'`.
- The sitemap is `@astrojs/sitemap` with a **hard-coded `customPages` list of ~7 URLs**; no CMS-driven slugs are included. `src/lib/sitemap-filter.ts` exists but is never imported.
- Images are all raw `<img>`; there is no image optimizer, no `srcset`, and no modern-format negotiation. Most have `width`/`height` and `loading="lazy"`.
- No analytics of any kind ships.
- `scripts/check-performance-budget.mjs` asserts a 0 KiB client-JS budget while the site ships 8 client script modules; the check is excluded from `check:all`.
- Dead code: `PageTemplate.astro`, `sitemap-filter.ts`, and the `buildStructuredData()`/`buildPageMetadata()` pair used only by the dead template.

### 1.3 CMS architecture

- **Legacy:** Strapi v4 (classic `data[].attributes` envelope, integer ids, no `documentId`). 27 collections are publicly readable without a token; the admin panel is reachable at `/admin`. Content volume: 82 blogs, 20 case studies, 40 technologies, 26 client logos, 17 blog categories, 11 industries, 8 news categories, 6 news, 6 resources, 6 client testimonials, 4 employee testimonials, 4 solution details, 2 openings, and one entry each for the nine landing-page collections. The media library holds **1,119 files** (414 PNG, 303 WebP, 184 PDF, 127 JPEG, 83 SVG) on the local provider under relative `/uploads/` paths. Three collections — `client-testimonials`, `employee-testimonials`, `downloads` — have customized controllers that return a **bare JSON array** instead of the standard envelope, which import tooling must special-case. Blogs carry **no `seo` component**; their SEO lives in flat fields (`canonical_url`, `image_alt`, social URLs), unlike `news`, `resources`, and the landing pages which do use a `seo` component. The i18n plugin is active but only `en` content exists.
- **Target:** FastAPI CMS with ~40 content tables, a consistent `ContentStatus` (`draft` | `publish`) model, a `ContentSeo` JSON column on most page types, S3-backed media served byte-for-byte from `/api/v1/public/media/{key}`, JWT + RBAC staff auth, and `/api/v1/public/*` read endpoints covering nearly every content type.
- **Importer:** exists only on the **unmerged** `strapi-sync` branch (single WIP commit `e587ea9`, ~4,000 lines, 22 files). It provides a `flycatch-import-strapi` CLI with 36 steps, slug-keyed idempotent upserts, a Strapi-blocks→HTML converter, media transfer to S3, and an optional id-map sidecar. It is additive-only, so git merge risk is low.

### 1.4 Dev deployment (`flycatch-website-dev.k3s.flycatchtech.in`)

Reachable and serving the Astro app behind Caddy. **Correctly non-indexable today**, three ways over: `robots.txt` is `User-agent: * / Disallow: /`, the response carries `x-robots-tag: noindex, nofollow`, and every page emits a `noindex, nofollow` meta. It sends `cache-control: no-store` on HTML and a strict (enforcing, not report-only) CSP.

Content is genuinely server-rendered — the home page's headings, sections, and 90 `<img>` tags are all present in the raw HTML with no hydration gap, and client JS totals roughly 20 KB. Seven top-level routes return 200; blog and case-study detail pages return 200 and are complete. The 404 page correctly returns HTTP 404.

Its defects, beyond the missing routes: the sitemap is served at `/sitemap-index.xml` while `/sitemap.xml` 404s, lists only 7 URLs, and emits each one twice (slashed and unslashed). Canonicals are inconsistent — `/services/ai-services` canonicalizes to the site root, blog details canonicalize to a `/company/blogs/<slug>` path shape that does not match their actual `/blogs/<slug>` URL, and `/about` serves **another page's metadata entirely** (title "Visualization Services in Saudi | Canada | UK | UAE", canonical `flycatchtech.com/en/services`, and a matching wrong `<h1>`). Four pages carry the CMS placeholder string "This section will appear when published content is available." as their meta description. `/company/testimonials` renders 87 characters of body text including a literal unrendered `#`, indicating Markdown is being inserted without processing, and `/company/clients` renders its logo grid with no accompanying copy. The home page declares `summary_large_image` but has no `og:image`, and its `FAQPage` JSON-LD has an empty `mainEntity`. The home page weighs ~2.7 MB with zero `srcset` or `<picture>` elements, a 101 KB SVG, and media responses that carry no `cache-control` or `etag` and reject `HEAD` with 405.

## 2. Gap Analysis

| Area | Production | Current dev | Required change |
| --- | --- | --- | --- |
| Stack | Next.js 14 + Strapi, one VM, no CDN | Astro SSR + FastAPI CMS on k3s | Keep the new stack; complete it |
| Indexable pages | 139 URLs | 7 top-level routes + blog/case-study details | Build the ~11 missing route templates |
| **Content in HTML** | **Client-rendered on 104 of 139 URLs** (~650 bytes visible text) | **Fully server-rendered** | **Dev is already correct — this is the migration's biggest single win** |
| Navigation in HTML | Client-rendered; crawlers see zero nav links | Server-rendered | Dev is correct; fix the link targets |
| Route paths | `/company/about-us`, `/company/blogs/<slug>` | `/about`, `/blogs/<slug>` | **Regression** — move dev routes to production paths |
| HTML caching | `no-store` | `no-store` (middleware) | Replace with cacheable rendering plus a CDN policy |
| Asset caching | `/public` `max-age=0`; `/_next/image` 60 s | `/_astro/**` immutable; **media has no `cache-control` or `etag`** | Long-lived immutable caching for assets and media |
| Soft 404s | **Unknown slugs return HTTP 200** with slug-derived titles; `/company` returns 200 empty | Dynamic misses likely return 200 | Both must return HTTP 404 |
| Meta description | **Absent on home**; one generic string shared across 22 pages | Present, but CMS placeholder text on 4 pages | Require a real description on every indexable page |
| Canonical | Present, but broken on the Saudi page (non-www `/en/` two-hop chain) | Inconsistent; `/services/ai-services` → `/`; `/about` → wrong page | Self-referencing canonical everywhere |
| Headings | 8 of 13 sampled pages have **no `h1`**; home `h1` hidden; Saudi `h1` empty | Present | Exactly one meaningful visible `h1` per page |
| Structured data | One static `Organization`/`LocalBusiness` block repeated site-wide, `sameAs` empty | `Organization`, `WebPage`, `FAQPage` (empty `mainEntity`), `BlogPosting`, `Article` | Extend with `WebSite`, `BreadcrumbList`, `Service`; never emit empty markup |
| Breadcrumbs | None | None | Add semantic breadcrumbs + `BreadcrumbList` |
| Sitemap | 139 URLs at `/sitemap.xml`, one shared `lastmod` | 7 URLs at `/sitemap-index.xml`; `/sitemap.xml` 404s; duplicate slashed variants | Generate from CMS at `/sitemap.xml`, one entry per URL |
| Images | 70 `_next/image` refs, AVIF when negotiated, but all at `w=3840`; 372 KB logo SVG | Raw `<img>`, **zero `srcset`**, ~2.7 MB home page, 101 KB SVG | Responsive, modern-format delivery for CMS and static media |
| Analytics | GTM `GTM-5SK96WK` → GA4 `G-G8VWZ0924F`, Hotjar `1872525`, Drift `p3d94p49we9d`; dead `UA-170193189-1` | None | **Unfinished** — migrate the container, drop the dead UA tag |
| Forms | **Zero `<form>` elements**; JS POSTs direct to Strapi with reCAPTCHA v2 | Newsletter POST only; two endpoints return 501 | Real forms with server validation, spam protection, rate limiting, email |
| Email | Sends notifications | Config and templates stored, **no mailer exists** | Build the send pipeline |
| Client JS | 33 chunks + 39 KB polyfills + 85 KB `next-intl` dictionary per page | ~20 KB, no framework runtime | Improvement — preserve, and enforce the budget in CI |
| Fonts | Subset woff2, `font-display: swap`, stale Google Fonts preconnect | `@fontsource/poppins` ×5 weights | Subset and reduce weights |
| CSP | Report-only, and missing the Drift and Hotjar hosts it loads | Enforcing | Improvement — keep enforcing, extend for the retained tags |

### 2.1 Classification of dev-vs-production differences

**Intentional improvements (keep):** **server-rendered content and navigation**, which is the single most valuable thing the new implementation already does right; FastAPI CMS replacing Strapi; typed centralized API client; no framework runtime; enforcing CSP; env-gated `noindex` enforced three ways; per-page meta descriptions; richer JSON-LD; a correctly status-coded 404 page.

**Unfinished work (complete):** ~11 missing route templates; CMS-driven sitemap at the conventional path; analytics; contact/careers/download forms and the email pipeline; the `strapi-sync` importer; image optimization; breadcrumbs; media cache headers.

**Regressions (correct before launch):** `/about` instead of `/company/about-us`, and serving another page's title, description, canonical, and `<h1>` entirely; `/blogs/<slug>` instead of `/company/blogs/<slug>`, which also contradicts its own canonical; `/services/ai-services` canonicalizing to the site root; ~25 nav/footer links in `src/lib/nav.ts` pointing at routes that 404, including the primary contact CTA and both footer legal links; `HomeMinds.astro` linking to `/about-us`; global `no-store`; dynamic `[slug]` misses returning HTTP 200; CMS placeholder text leaking into four pages' meta descriptions; `/company/testimonials` and `/company/clients` rendering essentially empty, with an unrendered Markdown `#` indicating a missing content pipeline; the home page declaring `summary_large_image` with no `og:image`; `FAQPage` JSON-LD with an empty `mainEntity`; the sitemap served at `/sitemap-index.xml` with duplicate slashed and unslashed entries; media endpoints rejecting `HEAD` with 405; empty `alt` on CMS images in three AI Services components; the home/AI-Services Figma rework diverging from the production design.

### 2.2 Production redirects that must be inherited

Production already serves redirects that are not visible in the sitemap but which carry link equity and must be reproduced:

| Production URL | Behaviour | Action |
| --- | --- | --- |
| `/services/hybrid-cloud`, `/services/cloud-security`, `/services/cloud-optimization` | 308 → `/services/cloud-migration` | Reproduce as 301 |
| `/services/data-management-strategy`, `/services/data-engineering` | 308 → `/services/data-migration` | Reproduce as 301 |
| `/en` and `/en/<slug>` | 308 → `/` and `/<slug>` | Reproduce; a leftover `next-intl` prefix that external links may still use |
| `/company/jobs-openings/contract` | 200, **absent from the sitemap** | Decide: index it or redirect it |
| `/company` | 200, empty, canonical points at the home page | Redirect to a real page or return 404 |

Seven further navigation entries — `/services/cloud-consult`, `/services/business-intelligence`, `/services/big-data-analysis`, `/services/agentic-ai`, `/services/enterprise-gpt`, `/services/conversational-ai`, `/services/knowledge-ai` — are advertised in production's menu but **return 404 today**. The menu promises roughly 22 services against 10 real pages. These need no redirect, but the new navigation must not repeat the dead links.

## 3. Page Inventory

139 production URLs across 20 route templates. Status is against the current `dev` branch.

| Production URL / pattern | Count | Status | Notes |
| --- | ---: | --- | --- |
| `/` | 1 | Partial | Exists; Figma rework diverges from production design |
| `/services` | 1 | Missing | Services index |
| `/services/<slug>` | 10 | Partial | Only `/services/ai-services` exists |
| `/solutions` | 1 | Missing | Solutions index |
| `/solutions/<slug>` | 8 | Missing | 3 products + 5 AI solutions; CMS models exist |
| `/case-studies` | 1 | Implemented | Production version is client-rendered (845 bytes of text); dev is server-rendered |
| `/case-studies/<slug>` | 20 | Implemented | Dev route works; production is client-rendered |
| `/company/about-us` | 1 | Requires redirect | Dev serves `/about` — must move |
| `/company/blogs` | 1 | Implemented | |
| `/company/blogs/<slug>` | 82 | Requires redirect | Dev serves `/blogs/<slug>` — must move |
| `/company/careers` | 1 | Missing | |
| `/company/jobs-openings` | 1 | Missing | `Opening` model exists |
| `/company/jobs-openings/<slug>` | 2 | Missing | |
| `/company/clients` | 1 | Partial | Route exists but renders logos with no body copy |
| `/company/testimonials` | 1 | Partial | Route exists but renders 87 characters, including unrendered Markdown |
| `/company/resources` | 1 | Missing | `Resource` model exists; detail URLs absent from sitemap |
| `/company/memberships` | 1 | Missing | `Membership` model exists |
| `/company/news-and-events` | 1 | Missing | `News` model exists; detail URLs absent from sitemap |
| `/contact-us` | 1 | Missing | Linked by CTAs that currently 404 |
| `/software-development-services-in-saudi-arabia` | 1 | Missing | `FlycatchSaudiArabia` model exists |
| `/privacy-policy` | 1 | Missing | No CMS model — **requires CMS work** |
| `/terms-and-conditions` | 1 | Missing | No CMS model — **requires CMS work** |
| `/404` | — | Implemented | Correctly returns HTTP 404 |

Plus the redirect and non-sitemap URLs in Section 2.2.

**Content types needing CMS work beyond the importer:** privacy policy and terms (no model); `AiServiceSolution` junction rows (importer never creates them, but the dev AI Services UI expects them); blog SEO (Strapi blogs have **no `seo` component** — their SEO is in flat fields, and the local `Blog` model has no `seo` column either, so the mapping must be field-to-field); case-study SEO (Strapi supplies it, the importer fetches it, the local model has nowhere to store it); `SolutionProduct` SEO; the Saudi page banner image.

**Importer collection-name mismatches to verify:** the importer reads a `subscriptions` collection, but `/api/subscriptions` returns **404** on this Strapi instance. Several other names the importer uses were not among the probed set and need confirmation before the real run: `homepages`, `homepage-seo`, `products`, `data-and-analytics`, `dev-ops-consultations`, `infrastructure-management-and-automations`, `application-development-services`. Confirmed present and correctly named: `awards` (→ memberships), `contenttype-categories` (→ case-study categories), `services` (→ overview), `flycatch-saudi-arabias`.

**Slug hazards in the production URL set.** Beyond the camelCase families, the blog slugs contain machine-generated artifacts that must be preserved verbatim because they are indexed: word-splitting (`dev-sec-ops` for DevSecOps, `saa-s` for SaaS, `soft-pos` for SoftPOS, `i-o` for I/O), possessive apostrophes rendered as `-s`, three near-duplicate `-1`/`-2` republish pairs, and one 185-character slug that is an entire meta description pasted into the URL.

**Sitemap coverage gap:** production's sitemap lists the `news-and-events` and `resources` **index** pages but no detail URLs, so those detail pages are currently unindexed. The new sitemap should include them. Production also has **no `/industries` or `/technologies` pages** — industry is only a client-side filter facet on `/case-studies`, and those filtered views produce no crawlable URLs.

## 4. SEO Audit

### 4.1 Production defects

| Defect | Evidence | Severity |
| --- | --- | --- |
| **Content absent from server HTML** | 82 blogs, 20 case studies, 2 job openings and the listing pages render ~600–850 bytes of visible text; bodies, headings, authors and dates are client-fetched from Strapi | **Critical** |
| **Navigation absent from server HTML** | `<header>` contains only a logo and a hamburger button; the mega-menu is client-rendered, so crawlers see zero nav links. All 25 links in the home page HTML come from the footer | **Critical** |
| **Soft 404s at HTTP 200** | `/company/blogs/no-such-blog-post` returns 200 with a slug-derived title, a self-referencing canonical, and no `noindex` — an unbounded set of indexable empty URLs. Same pattern on case studies and job openings. `/company` also returns 200 empty | **Critical** |
| No meta description on the home page | `<meta name="description">` absent from `/` | High |
| Uncacheable HTML | `cache-control: no-store` on every page, with no CDN and one VM shared with Strapi | High |
| Case-sensitive URL trap | `/services/devOps-consultation` returns 200; `/services/devops-consultation` returns **404** | High |
| Duplicate content | `/solutions/flyGrid-ai` **and** `/solutions/flygrid-ai` both return 200 | High |
| Broken canonical on the Saudi page | Canonical is `https://flycatchtech.com/en/...` — non-www, phantom `/en` prefix, resolving via a two-hop chain to a different URL | High |
| No crawl path to most blog posts | The listing is client-rendered with client-only pagination and filters; `?page=2` returns page 1's markup. The sitemap is the only route to older posts | High |
| Missing or hidden `h1` | 8 of 13 sampled pages have no `h1`; the home `h1` is visually hidden and keyword-stuffed; the Saudi page's `h1` is empty | Medium |
| Thin structured data | One block repeated site-wide; `sameAs` empty despite three social links in the footer; no `WebSite`, `BreadcrumbList`, `BlogPosting`, `Service`, `JobPosting`, `FAQPage` | Medium |
| Shared generic description | One identical description across 20 case studies and both job pages; the home description contains a literal newline | Medium |
| Single site-wide `og:image` | All 139 pages share `/opengraph-image.jpg` | Medium |
| No breadcrumbs | Deep URLs have no trail or markup | Medium |
| Detail pages missing from sitemap | News and resources detail URLs are not listed | Medium |
| Title defects | `twitter:title` duplicates the brand; two service pages lack the brand suffix and use a plural "Companies"; `It Recruiter` from naive slug title-casing | Low |
| Redundant redirect hop | `http://flycatchtech.com/` takes two hops to reach the canonical URL | Low |

Working correctly on production and worth preserving: `https` and `www` canonicalization; trailing-slash normalization via 308 to the no-slash form; a correct 404 status and `noindex` on the genuine 404 page; a valid single-file sitemap referenced from `robots.txt` in which all 139 URLs return 200; `alt` present on every image; broadly correct `loading="lazy"` with `fetchPriority="high"` on the hero.

### 4.2 Current dev defects

| Defect | Severity |
| --- | --- |
| Sitemap has 7 URLs, is served at `/sitemap-index.xml` while `/sitemap.xml` 404s, and lists each URL twice (slashed and unslashed) | High |
| ~25 nav/footer links 404, including the primary contact CTA and both footer legal links | High |
| Route paths diverge from production (`/about`, `/blogs/<slug>`) | High |
| `/about` serves a different page's title, description, canonical, and `<h1>` ("Visualization Services", canonical `flycatchtech.com/en/services`) | High |
| `/services/ai-services` canonicalizes to the site root, which would deindex it in favour of the home page | High |
| Blog detail pages canonicalize to `/company/blogs/<slug>` while serving at `/blogs/<slug>` | High |
| `no-store` on all responses; media responses have no `cache-control` or `etag` | High |
| Dynamic `[slug]` misses likely return HTTP 200 with a "not found" body | High |
| CMS placeholder string "This section will appear when published content is available." used as the meta description on four pages | Medium |
| `/company/testimonials` and `/company/clients` render essentially empty, with an unrendered Markdown `#` indicating a missing content pipeline | Medium |
| Home page declares `summary_large_image` with no `og:image` | Medium |
| `FAQPage` JSON-LD with an empty `mainEntity`; `Organization` and `WebPage` disagree on the host | Medium |
| No breadcrumbs or `BreadcrumbList` | Medium |
| List pages use generic `fallbackMetadata` instead of CMS SEO fields | Medium |
| Empty `alt` on CMS images in AI Services components | Medium |
| Media endpoints reject `HEAD` with 405, which breaks link checkers and CDN origin probes | Low |
| No `WebSite` or `Service` JSON-LD | Low |

### 4.3 Target

Every indexable page: a unique `<title>` and meta description sourced from CMS `ContentSeo`, a self-referencing canonical on the production origin, OpenGraph and Twitter tags with a real image, and explicit robots directives where a page must not be indexed. Content rendered server-side into the initial HTML. JSON-LD limited to types that accurately describe the page: `Organization` and `WebSite` site-wide; `WebPage` plus `BreadcrumbList` on content pages; `BlogPosting` on blog posts; `Article` on case studies; `Service` on service pages; `FAQPage` only where a real FAQ block exists. A sitemap generated from published CMS content. Production `robots.txt` allowing crawl and naming the sitemap; every non-production environment keeping both `Disallow: /` and `X-Robots-Tag: noindex`.

## 5. Performance Audit

**Production, measured causes of slowness.** The home page pulls 67 static assets totalling ~1.01 MB transferred, plus 48 KB of brotli HTML and a 362 KB GTM container — roughly **1.42 MB before Hotjar and Drift are injected**, from a single un-fronted VM.

1. `no-store` on HTML defeats CDN and browser caching entirely. There is no CDN at all, and the origin shares a host with Strapi. `vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch` also defeats prefetch caching.
2. **The preloaded company logo is a 372 KB SVG** (`flycatchLightLogo.svg`, 174 KB transferred), fetched first with `fetchPriority="high"` — a likely LCP blocker, and about 17% of page weight for one logo.
3. Every CMS image is requested at **`w=3840`** regardless of display size; one decorative orbit graphic costs 170 KB.
4. `/public` assets are served `max-age=0`, so the 372 KB logo is revalidated on every navigation. `/_next/image` gets only 60 seconds.
5. 33 JS chunks including **39 KB of legacy polyfills** shipped to every browser, and an **85 KB `next-intl` message dictionary inlined into every page** for a site with one locale.
6. 13 CSS files, **7 of them render-blocking** in the head, plus a render-blocking inline script.
7. Because content is client-fetched, the critical path is HTML → JS → hydrate → Strapi → paint, rather than HTML → paint.
8. Stale `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com` while no Google Fonts stylesheet is ever loaded — two wasted connection warm-ups.
9. Strapi responses are large and unbounded — `/api/blogs` alone returns ~275 KB with default population.

Production does one thing well here: `/_next/image` negotiates AVIF when the browser advertises it, cutting the orbit graphic from 170 KB to 65 KB. The new implementation currently has no equivalent.

**Already present in the new implementation:**

1. `src/middleware.ts` forcing `no-store` reproduces the single worst production problem.
2. Every request re-fetches from the Backend with no `fetch` caching, no revalidation tags, and no CDN layer.
3. No image optimization at all — **zero `srcset` and zero `<picture>` elements**, so a mobile client downloads the same 530 KB hero asset as a desktop. The home page weighs ~2.7 MB, including a 101 KB SVG and ~350 KB of PNGs where WebP would apply. This is a direct LCP risk and is currently *worse* than production's `_next/image`.
4. Media responses carry no `cache-control` and no `etag`, so the largest payloads on the site are the least cacheable — while `/_astro/**` is correctly `immutable`.
5. CSS is not meaningfully route-split: the home page and the 404 page both load a stylesheet named `about.*.css`.
6. Five Poppins weights loaded unsubsetted.
7. The performance budget script is not wired into `check:all`, so the 0 KiB JS assertion never runs in CI and has already drifted.

The new implementation is nonetheless already ahead on the two things that matter most: content is server-rendered, and client JS is ~20 KB against production's 33 chunks. Its 90 images all carry explicit `width`/`height`, and 64 are lazy-loaded with exactly one eager — sensible LCP prioritization.

**Targets:** LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile on mobile; TTFB ≤ 600 ms for cached HTML; measurable improvement against a captured production baseline.

## 6. Security Audit

| Finding | Where | Action |
| --- | --- | --- |
| **Unpublished drafts leak** via `?publicationState=preview` — blogs go from 82 to 86, exposing 4 unpublished posts | Legacy CMS | Restrict the public `find` permission; the importer must respect publication state |
| **Staff account data leaks** through the blog `author` relation, returning a real `users` record including the email `muneer@flycatchtech.com` | Legacy CMS | Stop over-populating `author`; do not carry the leak into the new CMS |
| **Entire media library is public** — `/api/upload/files` returns metadata for all 1,119 files, including 184 PDFs | Legacy CMS | Restrict; note it is also how the importer enumerates media |
| `/api/users` and `/api/users-permissions/roles` return 200 unauthenticated | Legacy CMS | Restrict |
| Lead-capture collections (`downloads`, `contacts`, `applications`) exposed as public reads, with `downloads` returning PII | Legacy CMS | Restrict; mirrors the same defect in the new Backend |
| Strapi admin panel publicly reachable at `cms.flycatchtech.com/admin` | Legacy CMS | Restrict or decommission after migration |
| Production CSP is report-only **and omits the Drift and Hotjar hosts it actually loads**, so enforcing it today would break them | Production | Fix the policy before enforcing; the new stack already enforces CSP |
| Production CSP still allows a second Strapi origin, `fly-strapi.flycatchtech.in` | Production | Determine whether content still references it, then remove |
| `CORS allow_origins=["*"]` on the Backend | `apps/Backend/main.py` | Restrict to known origins |
| No rate limiting or spam protection on public writes | Backend | Add before exposing contact/careers forms |
| `set:html` on CMS-supplied HTML in 5 components | `apps/Frontend` | Confirm server-side sanitization is authoritative |
| Public `/api/v1/public/contacts` and `/applications` expose PII by UUID | Backend | Remove or authenticate these public reads |
| Production CSP is report-only | Production | The new stack already enforces CSP — keep it |

No CMS token is exposed client-side today, and the architecture keeps it that way: public reads are unauthenticated, and the Strapi token is used only by a server-side CLI.

## 7. Forms and Analytics Inventory

Production has **no `<form>` elements anywhere**. Every submission is React state plus a programmatic POST direct from the browser to Strapi, so nothing works without JavaScript and inputs lack `name`, `type`, and label association.

| Form | Location | Fields | Destination | Protection |
| --- | --- | --- | --- | --- |
| Contact | `/contact-us`, three variants selected by `contact_type`: `PARTNERSHIP`, `GENERAL_ENQUIRY`, `GET_A_QUOTE` | `name`, `last_name`, `email`, `phone_no` (with country-code selector), `details`, `company_name`, `subject`, plus a required consent checkbox | `POST cms.flycatchtech.com/api/contacts/` | **reCAPTCHA v2 checkbox**, site key `6LdGw5kqAAAAAHDPmQSzayLL4cTdXUL_-9Lw_dIt` |
| Job application | `/company/jobs-openings/<slug>`, in a drawer | Contact fields, "tell us more", **résumé file upload** | `POST cms.flycatchtech.com/api/applications/` | Captcha |
| Newsletter | Footer of every page | One email field, no `name`, no `id`, no `type="email"` | `POST cms.flycatchtech.com/api/subscriptions/subscribe` | **None** |

Required-field sets differ per contact variant: partnership requires company name and details; general enquiry requires a subject; quote requires details. Email validation is a single regex.

Analytics is one GTM container, `GTM-5SK96WK`, firing on all pages where the hostname ends in `flycatchtech.com`. It contains four configurations:

| Tag | Identifier | Action |
| --- | --- | --- |
| GA4 | `G-G8VWZ0924F` | Retain |
| Hotjar | site `1872525` | Confirm whether still wanted |
| Drift chat | `p3d94p49we9d`, injected as inline Custom HTML | Confirm whether still wanted; if retained, load it properly |
| Universal Analytics | `UA-170193189-1` | **Drop** — UA stopped processing data in July 2023 |

No Meta Pixel, LinkedIn Insight, Clarity, HubSpot, Intercom, Segment, or Mixpanel is present. Both Drift and Hotjar are absent from the CSP allowlist, which is only survivable because the policy is report-only.

## What Changes

- **Complete production page parity** on the Astro frontend: build the ~11 missing route templates so all 139 production URLs resolve, at the **exact production paths**.
- **BREAKING (internal, pre-launch):** relocate `/about` → `/company/about-us` and `/blogs/<slug>` → `/company/blogs/<slug>` to match production. No public impact, since the dev site is not indexed.
- **Reconcile the Figma rework** on the home page and AI Services page back toward the production design, keeping only changes that improve accessibility, responsiveness, performance, or SEO.
- **Merge and finish the `strapi-sync` importer**: close the SEO-mapping gaps for blogs, case studies, and solution products; create `AiServiceSolution` links; add tests for the untested steps.
- **Replace global `no-store`** with a per-route caching and revalidation policy plus a CDN-friendly `Cache-Control`, and prerender CMS pages where content changes infrequently.
- **Build the SEO layer**: CMS-driven sitemap, env-aware `robots.txt` with a sitemap reference, self-referencing canonicals, breadcrumbs with `BreadcrumbList`, and accurate JSON-LD per page type.
- **Define the redirect map**: preserve all 139 production URLs; **inherit production's existing 308 redirects** (five service aliases collapsing onto `/services/cloud-migration` and `/services/data-migration`, plus the `/en` locale prefix); add 301s for the lowercase variants of the two camelCase URL families; and resolve the `flyGrid-ai`/`flygrid-ai` duplicate with a canonical and a 301.
- **Preserve blog slugs verbatim**, including the word-splitting artifacts (`dev-sec-ops`, `saa-s`, `soft-pos`, `i-o`), possessive `-s` forms, `-1`/`-2` republish duplicates, and one 185-character slug.
- **Add image optimization**: responsive `srcset`/`sizes`, modern formats, explicit dimensions, correct alt text, and `fetchpriority` on hero images, with a CMS-media transform strategy.
- **Implement forms end-to-end**: contact, careers application, newsletter, and gated downloads — replacing the two 501 stubs — with validation, spam protection, rate limiting, and the currently absent email-send pipeline.
- **Migrate GTM `GTM-5SK96WK`** with a loading strategy that does not block render, retaining GA4 `G-G8VWZ0924F`, confirming Hotjar and Drift, and **dropping the dead `UA-170193189-1` tag**.
- **Add CMS models for privacy policy and terms**, which have no content type today.
- **Fix soft 404s** so dynamic slug misses return HTTP 404, and decide the fate of `/company` and `/company/jobs-openings/contract`, which production serves at 200 outside the sitemap.
- **Fix the dev-only metadata defects**: `/about` serving another page's head and `<h1>`, `/services/ai-services` canonicalizing to the root, blog canonicals disagreeing with their own URLs, CMS placeholder text used as meta descriptions, the missing home `og:image`, and the empty `FAQPage` markup.
- **Move the sitemap to `/sitemap.xml`** and emit one entry per URL rather than slashed and unslashed duplicates.
- **Fix the content pipeline gap** causing `/company/testimonials` and `/company/clients` to render nearly empty with unrendered Markdown.
- **Add cache headers and `HEAD` support to the media endpoint**, which today returns no `cache-control` or `etag` and rejects `HEAD` with 405.
- **Clean up**: delete `PageTemplate.astro`, `sitemap-filter.ts`, and the dead structured-data helpers; wire the performance budget into CI; correct the README's "static pre-rendered" claim.
- **Add a launch checklist** with pre- and post-launch verification, and keep every non-production environment non-indexable.

## Capabilities

### New Capabilities

- `public-site/page-parity`: every production URL resolves at its exact production path with equivalent content, sections, and CTAs; navigation and internal links point only at routes that exist.
- `public-site/url-preservation`: the production→new URL map, 301 redirect rules, case-sensitivity and duplicate-URL resolution, trailing-slash normalization, and HTTP 404 correctness.
- `public-site/seo-metadata`: per-page title, description, canonical, OpenGraph, Twitter, and robots directives, sourced from CMS SEO fields with defined fallbacks.
- `public-site/structured-data`: JSON-LD emission rules per page type, breadcrumbs, and the constraint that markup must accurately describe the page.
- `public-site/discoverability`: CMS-driven sitemap generation and splitting, plus environment-aware `robots.txt` and indexability controls.
- `public-site/performance`: rendering and caching strategy, Core Web Vitals budgets, client-JS budget, and font strategy.
- `public-site/media`: responsive and modern-format image delivery, dimensions, alt text, and hero-image priority for both CMS and static media.
- `public-site/forms`: contact, careers, newsletter, and download form behaviour — fields, validation, spam protection, rate limiting, success/error states, and email notification.
- `public-site/analytics`: tag management and consent-safe, render-non-blocking loading.
- `public-site/accessibility`: semantic structure, heading hierarchy, keyboard and focus behaviour, accessible navigation, and contrast.
- `cms/strapi-import`: one-time, re-runnable migration of Strapi content and media into the FastAPI CMS, including field, SEO, slug, and relation mapping.
- `cms/content-delivery`: how the frontend consumes the public CMS API — caching, revalidation, request deduplication, typing, and graceful degradation when the CMS is unavailable.
- `migration/launch-safety`: pre-launch and post-launch verification gates protecting search rankings during cutover.

### Modified Capabilities

None. `openspec/specs/` is empty, so every capability above is new.

## 8. Required Changes

### Critical (blockers for production migration)

1. Route paths corrected to production URLs (`/company/about-us`, `/company/blogs/<slug>`).
2. All 139 production URLs resolving with production-equivalent content.
3. Strapi content and media migrated, including blog and case-study SEO.
4. CMS-driven sitemap and production `robots.txt`.
5. Canonicals correct on every indexable page — including fixing `/about` serving another page's head, `/services/ai-services` canonicalizing to the root, and blog canonicals disagreeing with their own URLs.
6. 301 redirect map deployed, covering the camelCase/lowercase cases, the duplicate-URL case, **and production's existing 308 aliases and `/en` prefix**.
7. Global `no-store` replaced with a real caching policy, and cache headers added to the media endpoint.
8. Image optimization for hero and above-the-fold media — currently the new site has zero `srcset` and is heavier than production here.
9. Contact and careers forms working, with the email pipeline and reCAPTCHA.
10. GTM `GTM-5SK96WK` migrated with GA4 `G-G8VWZ0924F` retained and `UA-170193189-1` dropped.
11. Soft 404s returning HTTP 404, on both the new site and the URLs production currently serves at 200 (`/company`, unknown slugs).
12. All nav/footer links resolving, without reintroducing production's seven dead menu entries.
13. Dev and staging remaining non-indexable.
14. Public PII-exposing endpoints removed or authenticated; CORS restricted.
15. Sitemap served at `/sitemap.xml` with one entry per URL.
16. CMS placeholder text removed from meta descriptions, and the content pipeline fixed so `/company/testimonials` and `/company/clients` render their copy.

### Recommended

1. Breadcrumbs and `BreadcrumbList` on deep pages.
2. `WebSite` and `Service` JSON-LD.
3. News and resources detail pages added to the sitemap.
4. Font subsetting and weight reduction.
5. Rate limiting and spam protection on public writes.
6. Dead-code removal and the performance budget wired into CI.
7. Alt text corrected on CMS images in the AI Services components.
8. Privacy policy and terms moved into the CMS.
9. The hidden keyword-stuffed H1 replaced with a real visible heading, and an `h1` added to the pages that lack one.
10. `sameAs` populated on `Organization` from the real social profiles.
11. Per-page `og:image` instead of one site-wide default.
12. `HEAD` support on the media endpoint.
13. A crawlable path to older blog posts (server-rendered pagination), which production lacks entirely.
14. Report the Strapi exposures — draft leakage via `publicationState=preview`, the public media library, the staff email in the `author` relation, and the public lead collections — to whoever owns that instance, independently of the migration timeline.

### Optional

1. Sitemap index splitting (only needed well beyond the current 139 URLs).
2. Consent management for analytics.
3. Search Console URL Inspection automation in CI.
4. i18n groundwork (production sends `x-locale: en`; only one locale exists today).

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Ranking loss from URL changes | Medium | High | Freeze the 139-URL map; verify every URL resolves or 301s before cutover |
| The camelCase URLs (`devOps-consultation`, `flyGrid-ai`) are broken by a lowercase-normalizing router | High | High | Treat exact-case paths as canonical; add lowercase 301s rather than renaming |
| Content loss in the Strapi import | Medium | High | Dry-run first, reconcile counts per collection, keep Strapi readable until verified |
| Blog/case-study SEO silently dropped (importer discards it today) | High | High | Add `seo` columns and mapping before running the real import |
| AI Services pages render without solution cards | High | Medium | Implement `AiServiceSolution` linking in the importer |
| Performance regression vs production from unoptimized images | High | High | Image optimization is a launch blocker, not a follow-up |
| Dev environment accidentally indexed | Low | High | Keep `Disallow: /` plus `X-Robots-Tag`; assert both in CI |
| Analytics gap at cutover | Medium | Medium | Migrate GTM and verify tag firing before DNS switch |
| Forms silently failing (501 stubs today) | High | High | End-to-end test submissions with real email delivery pre-launch |
| Figma-vs-production design conflict | Medium | Medium | Production is the agreed reference; enumerate and approve each deviation |
| `strapi-sync` merge drifting behind `dev` | Medium | Low | Additive-only branch; merge early |

## 10. Acceptance Criteria

1. All 139 production URLs resolve on the new site at their exact production paths, or return a 301 to a defined replacement.
2. Primary content of every indexable page is present in the initial server-rendered HTML.
3. Every indexable page has a unique title, a meta description, and a correct self-referencing canonical.
4. The sitemap is generated from published CMS content and contains no 404s or redirects.
5. Production `robots.txt` allows crawling and references the sitemap; every non-production environment returns `Disallow: /` **and** `X-Robots-Tag: noindex`.
6. Structured data validates and accurately describes each page type.
7. Hero and above-the-fold images are responsive, dimensioned, correctly prioritized, and served in a modern format.
8. No CMS API token is reachable from the browser.
9. Layouts are correct at mobile, tablet, laptop, and large-desktop breakpoints.
10. No broken internal links; no console or runtime errors on any template.
11. Contact, careers, newsletter, and download forms submit successfully and deliver notification email.
12. GTM `GTM-5SK96WK` fires on the new site.
13. Core Web Vitals meet the Section 5 targets and improve measurably against a captured production baseline.
14. Dynamic slug misses return HTTP 404.
15. The existing repository is refactored and completed rather than rebuilt.

## Impact

**Frontend (`apps/Frontend`)** — new route templates and components; route relocations; removal of `middleware.ts`'s blanket `no-store`; a real sitemap generator; breadcrumb and image components; analytics integration; deletion of `PageTemplate.astro`, `sitemap-filter.ts`, and the dead structured-data helpers; `nav.ts` reconciled with real routes.

**Backend (`apps/Backend`)** — merge and complete `strapi-sync`; add `seo` columns for blogs, case studies, and solution products (new Alembic migrations); add privacy-policy and terms content types; implement the public form endpoints replacing the two 501 stubs; build the email-send pipeline; add rate limiting and spam protection; restrict CORS; remove or authenticate the PII-exposing public reads.

**Administration FE** — editing surfaces for any new content types and SEO fields.

**Deployment** — CDN/caching configuration; redirect rules at the edge or in the app; production `PUBLIC_ENVIRONMENT`; a `STRAPI_API_TOKEN` secret for the import job only; DNS cutover.

**External** — Google Search Console (sitemap resubmission, change-of-address not required since the domain is unchanged); GTM container; the Strapi instance and its public admin panel, to be decommissioned after verification.
