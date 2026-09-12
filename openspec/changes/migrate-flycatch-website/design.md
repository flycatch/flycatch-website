## Context

See `proposal.md` — Why, and Sections 1–6 for the audit evidence behind the decisions here.

The constraints that shape this design:

- **The stack is already chosen and partly built.** `apps/Frontend` is Astro 5.7 SSR on `@astrojs/node` standalone, `apps/Backend` is FastAPI + PostgreSQL + S3 with `/api/v1/public/*` read endpoints, and deployment is Docker + k3s behind Caddy. The brief asks to improve rather than replace, and the existing API client, metadata layer, and SEO CI gates are sound foundations.
- **The content set is small.** 139 indexable URLs across ~20 route templates. That is well within reach of build-time generation and far below any sitemap-splitting threshold.
- **There is no managed ISR platform.** Unlike a Vercel-style host, k3s gives no built-in incremental regeneration, so any "fresh but cached" behaviour must be built from a CDN/reverse-proxy layer or from rebuilds.
- **The CMS is already a build-time dependency.** `scripts/ensure-published-snapshot.mjs` runs before `astro build`, so requiring the API at build time is an existing assumption, not a new one.
- **Production URLs are case-sensitive and partly camelCase.** `/services/devOps-consultation` and `/solutions/flyGrid-ai` must be served at that exact casing.
- **The importer exists but is unmerged and incomplete.** `strapi-sync` is additive-only, so it can be merged early with low conflict risk, but it drops blog and case-study SEO and never builds AI-service↔solution links.

## Goals / Non-Goals

**Goals:**

- A rendering and caching model that puts content in the initial HTML, gives a low TTFB, and refreshes on publish without a manual deploy.
- One place where SEO metadata, canonicals, structured data, and sitemap entries are derived, so a new route cannot silently ship without them.
- Image delivery that is responsive and modern-format for both static and CMS media, without introducing a third-party image CDN.
- A redirect layer that preserves all 139 URLs exactly, including casing, and resolves the known duplicate and case traps.
- An import path that can be rehearsed, reconciled, and re-run until the content matches, before cutover.

**Non-Goals:**

- Replacing Astro, FastAPI, or the deployment platform.
- Redesigning the site. Production is the visual reference; reconciliation is scoped to bringing divergent pages back toward it.
- Internationalization. Production sends `x-locale: en` but only one locale exists; the design must not preclude i18n, but does not implement it.
- Keeping Strapi alive behind the new site. It is a migration source only.
- Rebuilding the admin UI beyond the fields new content types require.

## Decisions

### D1. Rendering: prerender content pages, keep SSR for the genuinely dynamic ones

Keep `output: 'server'` and opt individual routes into build-time generation with `export const prerender = true` plus `getStaticPaths()` sourced from the public API. Content routes — home, services, solutions, case studies, blogs, news, resources, about, legal, the Saudi landing page — are prerendered. Routes that must be request-time — form endpoints, the sitemap, `robots.txt`, and anything reflecting per-request state — stay SSR.

*Why:* At 139 URLs, a full prerender is cheap and gives the best achievable TTFB and the strongest guarantee that content is in the initial HTML. Keeping `output: 'server'` rather than switching to `output: 'static'` preserves the existing adapter, middleware, and API routes, so this is an additive change to the current configuration.

*Alternatives considered:* Pure SSR with a CDN cache — simpler to build but leaves TTFB at the mercy of cache warmth and Backend latency, and the first request after each purge is slow. Pure static export — would force the form and sitemap endpoints elsewhere and abandon the existing adapter. Emulating ISR in middleware — meaningful complexity for a 139-page site.

### D2. Freshness: rebuild on publish, with a CDN cache as the second layer

A publish action in the admin triggers a frontend rebuild and redeploy. In front of that, Caddy serves HTML with a shared-cache lifetime plus stale-while-revalidate so that the SSR routes and the window between publish and redeploy stay fast.

*Why:* It matches the publish/snapshot flow the backend already has, and it means the common case — a visitor hitting a content page — is a static file from cache.

*Trade-off:* Publish-to-live latency becomes build time rather than seconds. Accepted for a marketing site; if it proves too slow, the fallback is to flip high-churn routes (blogs, news, openings) back to SSR with a short cache lifetime, which is a per-route change under D1.

### D3. Remove the blanket `no-store` middleware

Delete the unconditional `Cache-Control: no-store` in `src/middleware.ts` and set caching per response class: long-lived immutable caching for fingerprinted assets and media, shared caching with stale-while-revalidate for HTML, and `no-store` only for form responses and anything request-specific.

*Why:* This single line currently reproduces production's worst performance characteristic on the new site.

### D4. Redirects split by what they need to know

Host, scheme, trailing-slash, and static case-variant redirects are handled at the edge in Caddy. Content-aware redirects — a slug that changed during import — are handled in Astro's `redirects` configuration, generated from the same mapping file that drives verification.

*Why:* Edge rules are the cheapest place for rules that need no content knowledge, and they keep working even if the app is down. Content-derived redirects belong with the code that knows the slugs.

*Key detail:* Because Astro routing is case-sensitive, `/services/devOps-consultation` is served by a route file at that exact casing, and the lowercase variant is a redirect rule rather than a second route. The `flyGrid-ai`/`flygrid-ai` duplicate is resolved by choosing the sitemap's casing as canonical and redirecting the other.

*Inherited rules:* production already serves redirects that are absent from the sitemap and must be carried over — five service aliases (`hybrid-cloud`, `cloud-security`, `cloud-optimization` → `cloud-migration`; `data-management-strategy`, `data-engineering` → `data-migration`) and the `next-intl` leftover `/en` and `/en/<slug>` prefix. These become edge rules, reproduced as 301 rather than 308.

*Alternative considered:* Normalizing all URLs to lowercase. Rejected — it would break the two indexed camelCase URL families, which is exactly the ranking loss this migration must avoid.

### D5. Images through Astro's own asset pipeline

Use `astro:assets` with the sharp image service for both local and remote images, authorizing the Backend media origin through the image configuration so CMS media is optimized on the same path as static media. Prerendered pages get their variants generated at build; SSR routes use the on-demand endpoint. A single shared image component enforces `sizes`, dimensions, alt text, and hero priority so those cannot be forgotten per call site.

*Why:* It keeps optimization in-process with no new third-party dependency or cost, and the Backend can keep streaming original bytes without growing a transform pipeline.

*Alternatives considered:* Adding transform support to the FastAPI media endpoint — duplicates work Astro already does. An external image CDN — new vendor, new cost, and another origin in the CSP.

*Risk:* Build time grows with image count. Mitigated by caching the build image output between builds.

### D6. SEO derived centrally, enforced by CI

Extend the existing `BaseLayout.astro` + `src/lib/metadata.ts` seam rather than introducing a new one: every page passes a metadata object, and the layout is the only place that emits title, description, canonical, social tags, robots directives, and JSON-LD. A route registry maps each route to its page type, which drives breadcrumb construction, the structured-data type, and sitemap inclusion from one source.

The existing `scripts/check-seo.mjs` gate is extended to assert, per built page, a unique title, a non-empty description, a self-referencing canonical, a single `h1`, valid JSON-LD, and — for non-production builds — the presence of `noindex`.

*Why:* The audit found the current failure mode is omission: list pages fall back to generic metadata and the sitemap is a hard-coded array. A registry plus a build-time assertion makes omission fail loudly.

### D7. Sitemap generated from the route registry plus published content

Replace the hard-coded `customPages` array. The sitemap is produced from the route registry for static routes and from the public API's published records for dynamic ones, and `src/lib/sitemap-filter.ts` is either wired in or deleted. Splitting into a sitemap index is deferred until the URL count approaches the format limit.

### D8. Backend changes kept minimal and contract-first

Three categories only: add `seo` storage where the importer currently has nowhere to put it (blogs, case studies, solution products); add content types for privacy policy and terms; implement the two public form endpoints that are 501 stubs today, plus the email-send pipeline they need. Each follows the repository's contract-first convention — OpenAPI first, then schemas and router — and each content API gets its public read counterpart per the project's public-API rule.

*Why:* The backend already models nearly everything needed. Expanding it further would be over-engineering for a marketing site.

### D9. Import rehearsed against a disposable target, then reconciled

Merge `strapi-sync` early, close its mapping gaps, then run: rehearsal mode first, then a real import into a throwaway environment, then per-collection count reconciliation against Strapi, then a spot-check of rendered pages against production. Only after that does an import run against the launch environment. The id-map sidecar is retained between runs so relations stay stable.

*Why:* The importer's gaps are silent ones — SEO fields fetched and discarded, relations never created. Reconciliation by count and by rendered output is the only reliable way to catch that class of bug.

*Three source-shape hazards the rehearsal must surface:* the importer reads a `subscriptions` collection that returns **404** on this instance; `client-testimonials`, `employee-testimonials`, and `downloads` have customized controllers returning a **bare JSON array** instead of the standard envelope; and Strapi blogs carry **no `seo` component** at all, keeping their SEO in flat fields, unlike news, resources, and the landing pages. The importer must also pass `publicationState=live` rather than the default `preview`, since preview exposes four unpublished drafts that must not be migrated as published content.

### D10. Forms: real `<form>` elements, server-validated, rate-limited, with a honeypot plus reCAPTCHA

Production has **zero `<form>` elements** — every submission is a JS POST straight from the browser to Strapi, so nothing works without JavaScript and inputs lack `name`, `type`, and label association. The new forms use real `<form>` elements posting to the site's own server, which then calls the CMS. Endpoints validate on the server, apply per-IP rate limiting, and use a honeypot field as the first line of bot defence with reCAPTCHA behind it. Notification email goes through a queued sender so that a mail failure never loses a submission.

*On the challenge provider:* production already uses **reCAPTCHA v2 checkbox** (site key `6LdGw5kqAAAAAHDPmQSzayLL4cTdXUL_-9Lw_dIt`) on the contact and job-application forms, which is why its CSP allows `google.com` and `gstatic.com`. Continuing with reCAPTCHA is the lower-risk choice: the keys, the CSP allowances, and the staff familiarity already exist. The newsletter form, which production leaves entirely unprotected, gains the honeypot and rate limiting.

*Why:* The backend currently has no rate limiting, no spam protection, and no mailer, while the site is about to expose four public forms. A stored-then-notified flow is what makes "delivery failed" recoverable rather than a lost lead.

### D11. Analytics: GTM loaded after interactive, with a typed event layer

Load `GTM-5SK96WK` after the page is interactive, and route conversion events through a small typed wrapper rather than scattering direct pushes. Non-production environments do not initialize it.

*Why:* the container alone is 362 KB and injects Hotjar and Drift on top. Deferring it keeps the Core Web Vitals budgets achievable while retaining existing measurement.

*Container hygiene:* the container currently configures GA4 `G-G8VWZ0924F` (retain), Hotjar site `1872525` and Drift `p3d94p49we9d` (confirm with the business, and if retained, allow their hosts in the CSP, which production's report-only policy does not), and a dead `UA-170193189-1` Universal Analytics property that stopped processing data in July 2023 (drop).

*Trade-off:* Deferred loading can slightly undercount very short sessions. Accepted.

### D12. Testing layered to match the risk

Unit tests for metadata, structured data, sitemap, and redirect-map construction. Contract tests keeping the frontend's types aligned with the API. End-to-end tests for critical page rendering, navigation, forms, dynamic routes, and 404 behaviour. Build-time gates for SEO, client-JS budget, accessibility, and non-production indexability. A link crawl and a URL/redirect verification run against the deployed candidate.

*Why:* The highest-consequence failures here — a missing canonical, a soft 404, an indexable staging site — are cheap to assert automatically and expensive to discover after launch. The repository already has the harnesses (Vitest, Playwright, the `check:*` scripts); the gap is coverage and CI wiring, including the performance budget that `check:all` currently skips.

## Risks / Trade-offs

- **Build-time CMS dependency** → A CMS outage blocks deploys. Mitigated by the existing published-snapshot step and by keeping the last good build deployable.
- **Publish-to-live latency becomes build time** → Mitigated by the CDN layer in D2 and, if needed, by moving high-churn routes back to SSR per-route.
- **Prerender build time grows with content and images** → Mitigated by caching image build output; revisit if blogs grow well past their current count.
- **Case-sensitive routing is easy to break** → A single careless lowercase normalization loses two indexed URL families. Mitigated by explicit tests asserting the exact-case URLs return 200 and the lowercase variants return 301.
- **Silent import data loss** → Mitigated by rehearsal, per-collection reconciliation, and rendered-page spot checks before cutover (D9).
- **The Figma-versus-production reconciliation is subjective** → Mitigated by enumerating each deviation for approval rather than resolving them ad hoc during implementation.
- **Removing public PII endpoints may break an unknown consumer** → Low likelihood, since they appear unused by the frontend; verified by searching for consumers before removal.
- **Deferred GTM slightly undercounts short sessions** → Accepted in exchange for meeting the vitals budgets.

## Migration Plan

1. **Prepare** — capture the production baseline (URLs, metadata, structured data, analytics, performance) as the comparison artefact for every later gate.
2. **Foundation** — merge `strapi-sync`; remove the blanket `no-store`; delete dead code; wire the performance and accessibility gates into CI; fix the route paths that diverge from production.
3. **Content** — close the importer's SEO and relation gaps, add the missing backend storage and content types, then rehearse, import, and reconcile against a disposable environment.
4. **Parity** — build the missing route templates at exact production paths, reconcile the divergent designs, and fix the navigation so every link resolves.
5. **SEO** — route registry, metadata coverage, structured data, breadcrumbs, generated sitemap, `robots.txt`, redirect map.
6. **Performance and media** — prerendering, caching layers, the image pipeline, font subsetting.
7. **Forms and analytics** — public endpoints, spam protection, email pipeline, GTM.
8. **Verification** — run the full pre-launch gate set from the launch-safety spec against the deployed candidate.
9. **Cutover** — deploy, switch DNS, immediately re-verify redirects, canonicals, sitemap, robots, analytics, and forms against the live site; resubmit the sitemap.
10. **Monitor** — track indexed pages, crawl errors, organic traffic, field vitals, and lead volume against the baseline through the monitoring period, then retire Strapi and its public admin panel.

**Rollback:** the existing production deployment is kept intact and re-pointable by DNS throughout the monitoring period. Because the domain and URLs are unchanged, a rollback restores the prior site without any additional redirect work. Strapi stays running and readable until post-launch verification passes.

## Open Questions

- The exact publish-to-live latency the business will accept, which determines whether any high-churn route needs to move back to SSR under D2.
- Whether Hotjar (`1872525`) and Drift (`p3d94p49we9d`) are still wanted. Both fire today via GTM, and both are absent from production's CSP allowlist, so nobody would have noticed if they had broken.
- Whether the `news-and-events` and `resources` detail pages, absent from production's sitemap today, should be indexed on the new site. The design assumes yes.
- What to do with the two URLs production serves at 200 outside its sitemap: `/company` (empty, canonical pointing at the home page) and `/company/jobs-openings/contract` (real content). Each needs either indexing or a redirect.
- Whether the legacy `fly-strapi.flycatchtech.in` origin in production's CSP holds media still referenced by content, which the import reconciliation will reveal.

*Resolved by the audits:* the challenge provider is settled — production uses reCAPTCHA v2 checkbox, and D10 continues with it.
