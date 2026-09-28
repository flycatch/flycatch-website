# Implementation Plan: Public Page Entrance Motion

**Branch**: `037-page-entrance-motion` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/037-page-entrance-motion/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Restore production heading fade-and-zoom, pinned/hover nav motion, and **in-body section reveals** across the entire public Frontend. `/solutions` is the visual reference. One shell observer handles `data-hero-entrance` and `data-section-reveal` (default zoom; optional `rise`). Migrate existing per-page reveal scripts. No new libraries or Admin work.

## Technical Context

**Language/Version**: TypeScript 5.x, Astro 5 (`apps/Frontend`)

**Primary Dependencies**: Existing Astro static Frontend, CSS custom properties in `tokens.css`, Playwright. No GSAP/Framer/Lottie.

**Storage**: N/A (no CMS or API changes)

**Testing**: Playwright e2e sampling **multiple IA groups** (home, solutions, a service, a company listing, contact) plus no-JS, reduced-motion, and header pin; existing a11y/discoverability gates still pass

**Target Platform**: Public static site, mobile and desktop; motion is progressive enhancement

**Project Type**: Public marketing frontend (monorepo `apps/Frontend`)

**Performance Goals**: No new third-party JS; shared enhancer only; CLS 0 from heading motion (transform/opacity only); LCP remains the hero media; INP unaffected (no pointer handlers on the heading)

**Constraints**: WCAG 2.2 AA; heading never stuck at opacity 0 for no-JS or reduced-motion users; Conventional Commits; Frontend-only

**Scale/Scope**: Entire public Frontend. Hero titles, shared header, and marked in-body sections. Not Administration-FE or Backend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
| --- | --- | --- |
| I. SEO and AEO First | Heading stays in HTML; no-JS visible; no metadata/H1 changes | PASS |
| II. Native Elements First | CSS transitions + IntersectionObserver; no animation library | PASS |
| III. Contract-First | DOM/CSS contract in `contracts/ui-entrance-motion.v1.md`; no HTTP API (N/A for OpenAPI) | PASS |
| IV. Conventional Commits | Implement phase uses conventional messages | PASS |
| V. Internationalisation | No new user-facing strings | PASS |
| VI. Performance by Default | One small shared script; transform/opacity only | PASS |
| VII. Core Web Vitals | No layout animation; LCP is still banner media | PASS |
| VIII. Security by Default | No new inputs or endpoints | PASS |
| IX. Accessibility | Reduced-motion + no-JS revealed state; hover scale not required for keyboard (colour still changes on `:focus-visible` if we apply the same colour rule) | PASS |
| X. Design Consistency | One hero zoom + optional rise for existing in-body fade-ups; no third recipe | PASS |
| XI. Responsive UI | Hover scale desktop-only; heading entrance on all viewports | PASS |
| XII. Production-Grade | E2E coverage; match production timing | PASS |
| XIII. Quality Gates | Playwright + no new deps | PASS |

No unjustified violations. Workspace public-API counterpart rule does not apply (no content Admin API).

### Post-design re-check

Phase 1 artifacts describe a frontend DOM contract and motion state machine only. No Admin/public OpenAPI. Gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/037-page-entrance-motion/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-entrance-motion.v1.md
└── tasks.md             # /speckit-tasks — not created here
```

### Source Code (repository root)

```text
apps/Frontend/
├── src/
│   ├── layouts/BaseLayout.astro          # noscript / js class if needed
│   ├── components/SiteHeader.astro
│   ├── components/*Hero.astro            # data-hero-entrance on titles
│   ├── components/SolutionsProducts.astro
│   ├── components/ProcureFlex*.astro     # migrate data-pf-reveal
│   ├── scripts/hero-entrance.ts          # shared observer: hero + section
│   ├── scripts/site-header.ts            # remove hide-on-scroll
│   └── styles/layout.css                 # zoom, rise, nav hover, noscript
├── tests/e2e/
│   ├── public-no-js.spec.ts
│   └── (new) hero-entrance.spec.ts
```

**Structure Decision**: Public Frontend only, **site-wide**. Shared CSS/script in the shell; every page marks its `h1`; major in-body blocks use `data-section-reveal`. Delete per-page observers that reverse `is-visible`. Backend and Administration-FE unchanged.

## Complexity Tracking

> No constitution violations requiring justification.
