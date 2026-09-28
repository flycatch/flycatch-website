# Quickstart: Public Page Entrance Motion

Site-wide public Frontend. Validate against [spec.md](./spec.md), [data-model.md](./data-model.md), and [contracts/ui-entrance-motion.v1.md](./contracts/ui-entrance-motion.v1.md). `/solutions` is a visual check, not the only route.

## Prerequisites

- Branch `037-page-entrance-motion`
- `cd apps/Frontend && npm ci`
- Public site running as in the root README

## Setup

1. Load `hero-entrance.ts` once from `BaseLayout` or `SiteHeader`
2. Put `data-hero-entrance` on **every** public primary `h1`
3. Put `data-section-reveal` on major in-body blocks (section titles, product cards, media/copy pairs). Use `data-reveal="rise"` where today’s product pages fade up. Migrate `data-*-reveal` aliases
4. Shared start/end/reduced-motion/noscript rules in `layout.css`
5. Remove hide-on-scroll once in `site-header.ts`

## Validation scenarios

### 1. Heading on several IA groups (P1)

With JS enabled, confirm fade + zoom (~0.6s) then no reverse, on at least:

- `/`
- `/solutions`
- one `/services/...` landing
- one `/company/...` listing
- `/contact-us`

Compare heading motion with [https://www.flycatchtech.com/solutions](https://www.flycatchtech.com/solutions).

### 2. In-body sections

- `/solutions`: scroll product cards — zoom-in once, no reverse
- One product page (ProcureFlex or Credit Life): why/quote/feature clusters still reveal
- Completeness: leftover `data-*-reveal` is aliased or replaced; no observers that remove `is-visible` on leave

### 3. Completeness

Grep Frontend for leftover 1.5s scale-only hero rules. Every page with an `h1` should have `data-hero-entrance`.

### 4. No JavaScript / reduced motion

- Disable JS: `h1` and in-body copy visible on home and a product page
- `prefers-reduced-motion: reduce`: opacity 1 immediately on more than one route

### 5. Header (P2)

Desktop ≥ 1024px on **two** routes (e.g. `/` and `/contact-us`):

1. Hover a primary nav label — red + slight scale
2. Open Services flyout — scale-Y still works
3. Scroll ~500px — header still in the viewport

### 6. Quality gates

Frontend Playwright e2e (discoverability, a11y, no-JS, motion sample). No new animation libraries in `apps/Frontend/package.json`.
