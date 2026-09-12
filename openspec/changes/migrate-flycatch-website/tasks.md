## 1. Baseline and Preparation

- [ ] 1.1 Capture the production URL inventory from `https://www.flycatchtech.com/sitemap.xml` into a checked-in baseline file, and verify it records all 139 URLs with their exact path casing
- [ ] 1.2 Capture per-URL production metadata (title, description, canonical, OpenGraph, Twitter, robots, JSON-LD types) into the baseline, and verify every URL from 1.1 has an entry
- [ ] 1.3 Capture production Core Web Vitals and page-weight measurements for the home page, a service page, a solution page, a case study, and a blog post, and verify each has LCP, INP, CLS, TTFB, and transfer-size figures recorded
- [ ] 1.4 Inventory production third-party scripts and the GTM container configuration, marking each tag retain-or-drop, and verify the list accounts for every third-party script observed in production HTML
- [ ] 1.5 Inventory every production form with its fields, endpoint, and bot protection (confirming whether reCAPTCHA is in use, which production's CSP allowances suggest), and verify each form on the production site has an entry
- [ ] 1.6 Author the production→new URL mapping file covering all 139 URLs plus the known case and duplicate variants, and verify every baseline URL from 1.1 appears exactly once
- [ ] 1.7 Record production's existing redirects and non-sitemap 200 URLs (the five service aliases, the `/en` prefix, `/company`, `/company/jobs-openings/contract`) into the mapping file, and verify each has a defined destination or an explicit decision to 404
- [ ] 1.8 Report the Strapi exposures — draft leakage via `publicationState=preview`, the public media library, the staff email in the blog `author` relation, public `/api/users`, and the public lead collections — to the CMS owner, and verify the report is acknowledged

## 2. Repository and Architecture Cleanup

- [ ] 2.1 Merge the `strapi-sync` branch into `dev` and verify the backend test suite passes and `flycatch-import-strapi --help` runs
- [ ] 2.2 Remove the blanket `Cache-Control: no-store` from `apps/Frontend/src/middleware.ts` and replace it with per-response-class caching, verifying an HTML response no longer carries `no-store` and a form response still does
- [ ] 2.3 Delete `PageTemplate.astro`, `sitemap-filter.ts` (or wire it into the new sitemap), and the `buildStructuredData()`/`buildPageMetadata()` helpers used only by the dead template, verifying the build and unit tests still pass
- [ ] 2.4 Add `check:performance` to the `check:all` script and correct the client-JS budget to a figure the site actually meets, verifying the check runs in CI and fails when the budget is exceeded
- [ ] 2.5 Correct the README's "Static public site (Astro, pre-rendered HTML)" description to match the actual rendering model, and verify no remaining documentation claims a rendering strategy the code does not use
- [ ] 2.6 Relocate `/about` to `/company/about-us` and `/blogs/[slug]` to `/company/blogs/[slug]`, verifying the production paths return 200 and no internal link still points at the old paths
- [ ] 2.7 Reconcile `apps/Frontend/src/lib/nav.ts` and the footer so every entry targets an implemented route or is removed, verifying an automated link crawl of the dev deployment returns no 404
- [ ] 2.8 Make dynamic `[slug]` routes return HTTP 404 for unknown slugs, verifying an end-to-end test asserts the status code rather than the page body
- [ ] 2.9 Fix `/about` serving another page's title, description, canonical, and `<h1>`, verifying its metadata describes the about page
- [ ] 2.10 Fix `/services/ai-services` canonicalizing to the site root, verifying its canonical is self-referencing
- [ ] 2.11 Fix the content pipeline gap causing `/company/testimonials` and `/company/clients` to render nearly empty with an unrendered Markdown `#`, verifying both pages render their CMS copy as formatted HTML
- [ ] 2.12 Replace the CMS placeholder string used as the meta description on four pages with real descriptions, verifying the SEO gate rejects the placeholder text

## 3. Backend and CMS Readiness

- [ ] 3.1 Add SEO storage for blogs, case studies, and solution products via a new Alembic migration, verifying the migration applies and the new fields round-trip through the admin API
- [ ] 3.2 Extend the admin and public OpenAPI contracts and schemas for the new SEO fields, verifying the contract-drift check passes
- [ ] 3.3 Add privacy-policy and terms content types with SEO fields, admin CRUD, and their public read counterparts, verifying both contracts exist and the public endpoints return published records only
- [ ] 3.4 Restrict backend CORS from `*` to the known site origins, verifying a request from an unlisted origin is rejected and the site still renders
- [ ] 3.5 Remove or authenticate the public read endpoints that expose contact and job-application personal data, verifying an unauthenticated request no longer returns those records
- [ ] 3.6 Add per-IP rate limiting to public write endpoints, verifying a burst beyond the configured limit is rejected and normal submissions succeed
- [ ] 3.7 Add admin editing surfaces for the new content types and SEO fields in `apps/Administration-FE`, verifying an editor can set and publish them

## 4. Content Migration from Strapi

- [ ] 4.1 Map Strapi SEO components onto the new blog, case-study, and solution-product SEO fields in the importer, verifying an imported record exposes the source title, description, canonical, and image alt
- [ ] 4.2 Implement AI-service→solution-detail link creation in the importer, verifying an imported AI service page renders its solution cards
- [ ] 4.3 Import the Saudi Arabia page banner image and any other populated-but-discarded fields identified during rehearsal, verifying each appears on the rendered page
- [ ] 4.4 Change slug handling to preserve source slugs exactly and to report collisions instead of appending a suffix, verifying a mixed-case source slug survives the import unchanged
- [ ] 4.5 Add importer tests for the untested steps (leads, pages, taxonomies, media failure, rehearsal mode, id-map persistence, step filtering), verifying the backend test suite covers each step at least once
- [ ] 4.5a Correct the importer's collection names against the live instance — `subscriptions` currently 404s, and `homepages`, `homepage-seo`, `products`, `data-and-analytics`, `dev-ops-consultations`, `infrastructure-management-and-automations`, and `application-development-services` are unconfirmed — verifying every configured step resolves to a collection returning 200
- [ ] 4.5b Special-case the three collections with customized controllers returning a bare JSON array (`client-testimonials`, `employee-testimonials`, `downloads`), verifying each imports without an envelope-parsing error
- [ ] 4.5c Set the importer to request `publicationState=live` so the four unpublished drafts are not migrated as published, verifying the imported blog count is 82 rather than 86
- [ ] 4.5d Stop importing the Strapi `author` relation's staff account fields, verifying no imported record carries a staff email address
- [ ] 4.6 Run the importer in rehearsal mode against the live Strapi instance and verify the report lists every collection with a non-zero mapped count and no unhandled block types
- [ ] 4.7 Run a full import into a disposable environment and reconcile per-collection record counts against Strapi (82 blogs, 20 case studies, 40 technologies, 26 client logos, 17 categories, 11 industries, 8 news categories, 6 news, 6 resources, 6 client testimonials, 4 employee testimonials, 4 solution details, 2 openings, 1,119 media files), verifying every discrepancy is explained
- [ ] 4.8 Spot-check rendered pages from the imported content against their production counterparts across each content type, verifying body content, images, and SEO fields match
- [ ] 4.9 Author privacy policy and terms content in the CMS, verifying both pages render from CMS data rather than hard-coded markup

## 5. Production Page Parity

- [ ] 5.1 Build the services index and the nine missing `/services/<slug>` detail pages at their exact production paths, verifying each returns 200 and renders CMS content
- [ ] 5.2 Build the solutions index and all eight `/solutions/<slug>` detail pages, verifying the camelCase paths such as `/solutions/flyGrid-ai` return 200
- [ ] 5.3 Build `/company/careers`, `/company/jobs-openings`, and `/company/jobs-openings/<slug>`, verifying job listings render from CMS records
- [ ] 5.4 Build `/company/resources`, `/company/memberships`, and `/company/news-and-events` with their detail routes, verifying each index lists published records and each detail page returns 200
- [ ] 5.5 Build `/contact-us`, verifying every existing CTA that links to it now resolves
- [ ] 5.6 Build `/software-development-services-in-saudi-arabia`, `/privacy-policy`, and `/terms-and-conditions`, verifying each returns 200 and renders CMS content
- [ ] 5.7 Reconcile the home page and `/services/ai-services` toward the production design, recording each retained deviation with its justification, and verify the record is reviewed before launch
- [ ] 5.8 Verify all 139 baseline URLs against the deployed candidate, confirming each returns 200 or a single-hop 301 to a page returning 200

## 6. SEO Implementation

- [ ] 6.1 Introduce a route registry mapping each route to its page type, breadcrumb ancestry, structured-data type, and sitemap inclusion, verifying every route resolves through it
- [ ] 6.2 Ensure every page supplies CMS-derived metadata with defined fallbacks, verifying no page falls back to an undifferentiated site-wide default
- [ ] 6.3 Extend `scripts/check-seo.mjs` to assert per built page a unique title, non-empty description, self-referencing canonical, single `h1`, and valid JSON-LD, verifying the gate fails when any is missing
- [ ] 6.4 Emit `Organization` and `WebSite` structured data site-wide, verifying it appears on every rendered page
- [ ] 6.5 Emit page-type structured data (`WebPage`, `BlogPosting`, `Article`, `Service`, `FAQPage` only where a real FAQ block exists), verifying each type validates and no type is emitted for absent content
- [ ] 6.6 Implement semantic breadcrumbs with matching `BreadcrumbList` markup on pages below the top level, verifying the markup items match the visible trail and each links to a URL returning 200
- [ ] 6.7 Replace the hard-coded sitemap `customPages` with generation from the route registry and published CMS records, verifying every sitemap URL returns 200 and is its own canonical
- [ ] 6.8 Implement the production `robots.txt` with crawl permission, administrative disallows, and an absolute sitemap reference, verifying non-production still returns `Disallow: /`
- [ ] 6.9 Assert non-production indexability in CI, verifying the check fails if a non-production deployment becomes crawlable
- [ ] 6.10 Replace the hidden keyword-stuffed `h1` pattern with a visible descriptive heading on any page carrying it, verifying the heading gate still passes
- [ ] 6.11 Correct the duplicated brand suffix in social titles, verifying the brand name appears at most once
- [ ] 6.12 Move the sitemap to `/sitemap.xml` and emit one entry per URL instead of slashed and unslashed duplicates, verifying `/sitemap.xml` returns 200 and contains no duplicate `<loc>` values
- [ ] 6.13 Add a per-page `og:image` with a site-wide default fallback, verifying the home page no longer declares `summary_large_image` without an image
- [ ] 6.14 Populate `sameAs` on `Organization` from the real social profiles, verifying the emitted array is non-empty
- [ ] 6.15 Suppress `FAQPage` markup when the page has no FAQ entries, verifying no page emits an empty `mainEntity`
- [ ] 6.16 Add server-rendered pagination to the blog and case-study listings so every post is reachable by crawling, verifying a crawler starting at the listing can reach the oldest post without the sitemap

## 7. URL Preservation and Redirects

- [ ] 7.1 Implement host, scheme, and trailing-slash canonicalization at the edge, verifying the apex domain, `http`, and trailing-slash forms each return a single-hop 301 matching production behaviour
- [ ] 7.2 Implement lowercase→canonical redirects for the camelCase URL families, verifying `/services/devops-consultation` returns 301 to `/services/devOps-consultation`
- [ ] 7.3 Resolve the `flyGrid-ai`/`flygrid-ai` duplicate by choosing one canonical and redirecting the other, verifying only one of the pair returns 200
- [ ] 7.4 Generate the application-level redirect rules from the mapping file authored in 1.6, verifying the deployed rules and the mapping file do not diverge
- [ ] 7.5 Reproduce production's inherited redirects — the five service aliases onto `/services/cloud-migration` and `/services/data-migration`, and the `/en` and `/en/<slug>` locale prefix — as 301s, verifying each resolves to the same destination production serves
- [ ] 7.6 Apply the agreed decision for `/company` and `/company/jobs-openings/contract`, verifying each either returns 200 and appears in the sitemap or 301s to a defined target
- [ ] 7.7 Assert that blog slugs with word-splitting artifacts, possessive forms, `-1`/`-2` duplicates, and the 185-character slug all resolve unchanged, verifying each returns 200 at its exact production path
- [ ] 7.8 Add automated verification that walks the mapping file and asserts single-hop resolution, verifying the check fails on a chained or looping redirect

## 8. Performance and Media

- [ ] 8.1 Opt content routes into build-time generation with `getStaticPaths` sourced from the public API, verifying the built output contains an HTML file for each of the 139 URLs
- [ ] 8.2 Configure Caddy to serve HTML with shared caching and stale-while-revalidate, and assets and media with long-lived immutable caching, verifying the response headers on each class
- [ ] 8.3 Wire a publish action to trigger a frontend rebuild and redeploy, verifying a published CMS change appears on the deployed site without a manual deploy
- [ ] 8.4 Configure `astro:assets` with the sharp image service and authorize the Backend media origin, verifying a CMS image is served resized and in a modern format
- [ ] 8.5 Introduce a shared image component enforcing `sizes`, dimensions, alt text, and hero priority, and migrate all `<img>` usages to it, verifying no raw `<img>` remains for content images
- [ ] 8.6 Set eager loading with raised priority on hero images and lazy loading below the fold, verifying the LCP element is not lazy-loaded on any key template
- [ ] 8.7 Populate alt text for the CMS images in the AI Services components that currently pass an empty value, verifying the accessibility check reports no missing alternative text
- [ ] 8.8 Subset the Poppins font and drop unused weights, verifying the loaded weights match the weights the styles reference
- [ ] 8.9 Deduplicate CMS requests within a page render and narrow field selection to what each page uses, verifying no two requests in a single render fetch the same resource
- [ ] 8.10 Add `cache-control` and `etag` to media responses and support `HEAD`, verifying a `HEAD` request returns 200 rather than 405 and repeat fetches revalidate
- [ ] 8.11 Replace or minify the oversized SVG assets (the 101 KB SVG on the new site; production's equivalent is 372 KB), verifying no SVG in the critical path exceeds a declared size budget
- [ ] 8.12 Route-split CSS so a page loads only the styles it needs, verifying the home page no longer loads the about page's stylesheet
- [ ] 8.13 Measure the key templates against the budgets and the 1.3 baseline, verifying each meets LCP, INP, CLS, and TTFB targets and improves on production

## 9. Forms and Analytics

- [ ] 9.1 Implement the public contact submission endpoint replacing the 501 stub, verifying a valid submission is persisted and an invalid one is rejected with field-level errors
- [ ] 9.2 Implement the public career application endpoint with résumé upload, verifying the file is stored, associated with the application, and retrievable by staff
- [ ] 9.3 Implement the public newsletter signup endpoint replacing the 501 stub, verifying duplicate and malformed addresses are handled
- [ ] 9.4 Implement the gated download request endpoint, verifying a successful request returns the file reference and is recorded
- [ ] 9.5 Build the queued email-send pipeline using the stored email configuration and templates, verifying a submission produces a delivered notification and that a send failure does not lose the submission
- [ ] 9.6 Add a honeypot field and reCAPTCHA to the public forms, matching production's three contact variants (`PARTNERSHIP`, `GENERAL_ENQUIRY`, `GET_A_QUOTE`) and their differing required-field sets, verifying a bot-detected submission is rejected and a genuine submission succeeds
- [ ] 9.7 Build the contact, careers, newsletter, and download form UIs as real `<form>` elements with named, typed, labelled inputs and accessible success and error states, verifying a submission works with JavaScript disabled and that failing fields are identified and announced
- [ ] 9.8 Integrate GTM container `GTM-5SK96WK` loaded after interactive and disabled on non-production, retaining GA4 `G-G8VWZ0924F` and removing the dead `UA-170193189-1` tag, verifying tags fire on production and no event reaches the production property from the dev environment
- [ ] 9.8a Confirm with the business whether Hotjar (`1872525`) and Drift (`p3d94p49we9d`) are retained, and for any retained tag add its host to the CSP, verifying the enforcing policy does not block it
- [ ] 9.9 Emit typed conversion events on successful form submission, verifying the event is observable in tag management and its payload contains no personal data

## 10. Accessibility

- [ ] 10.1 Add semantic landmarks and a skip-to-content mechanism to the base layout, verifying a keyboard user can skip directly to main content
- [ ] 10.2 Correct heading hierarchy across all templates, verifying each page has exactly one first-level heading and skips no level
- [ ] 10.3 Make the navigation and flyout menus fully keyboard operable with correct focus movement, dismissal, and focus return, verifying keyboard-only navigation reaches and activates every item
- [ ] 10.4 Add visible focus indicators and accessible names for icon-only controls, verifying each control announces its purpose
- [ ] 10.5 Verify colour contrast across text and interface elements, correcting any pair below the minimum ratio
- [ ] 10.6 Extend the Playwright accessibility suite to cover every page template and wire it into CI, verifying a detected violation fails the check

## 11. Testing and Verification

- [ ] 11.1 Add unit tests for metadata, structured data, breadcrumb, sitemap, and redirect-map construction, verifying each module's outputs are asserted
- [ ] 11.2 Add end-to-end tests for critical page rendering, navigation, dynamic routes, 404 status, redirects, sitemap, and `robots.txt`, verifying the suite passes against a deployed candidate
- [ ] 11.3 Add responsive tests at mobile, tablet, laptop, and large-desktop widths for the key templates, verifying no overflow, overlap, or unreachable content
- [ ] 11.4 Add a link crawler to CI, verifying it fails on any internal 404 or server error
- [ ] 11.5 Add a structured-data validation step to CI, verifying it fails on invalid JSON-LD
- [ ] 11.6 Run the full pre-launch gate set from the launch-safety spec against the deployed candidate, verifying every gate passes and the results are recorded against the baseline

## 12. Launch and Post-Launch

- [ ] 12.1 Confirm the rollback procedure by rehearsing a revert to the existing production deployment, verifying the prior site serves correctly
- [ ] 12.2 Deploy to production and switch DNS, verifying the new site serves on the canonical host over HTTPS
- [ ] 12.3 Immediately re-verify the redirect map, canonicals, sitemap, `robots.txt`, analytics, and form submissions against the live site, verifying each matches the pre-launch result
- [ ] 12.4 Submit the sitemap in Search Console and confirm ownership verification still holds, verifying the sitemap reports no errors
- [ ] 12.5 Monitor indexed page counts, crawl errors, organic traffic, field Core Web Vitals, and lead volume against the baseline through the monitoring period, verifying any regression is investigated and recorded
- [ ] 12.6 Retire the Strapi instance and its publicly reachable admin panel once post-launch verification has passed, verifying the legacy host no longer serves the admin interface
