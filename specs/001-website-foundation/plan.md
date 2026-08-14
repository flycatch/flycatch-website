# Implementation Plan: Website Foundation

**Branch**: `001-website-foundation` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-website-foundation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Establish a production-ready, SEO-first foundation with three bounded surfaces: a statically delivered public site, a FastAPI contract-first backend, and a separate authenticated Administration UI. Public pages are pre-rendered HTML (Astro 5, no client JavaScript on foundation templates). React 19 is used only in the Administration UI (Astro + `@astrojs/react`). PostgreSQL holds administrators, sessions, and draft/published records. S3-compatible storage holds the social-preview image slot and the published snapshot consumed at build time. Ordinary public browsing never requires the API. Shared deployment lives in `deployment/` (Docker Compose, environment config, gateway). OpenAPI in `specs/001-website-foundation/contracts/` is the single source of truth; Frontend and Administration FE MUST consume and match the Backend contract. Scope stays inside the specification: placeholder routes, contracts (including stubs), sign-in, one draft/publish path, and quality gates — no marketing IA, brand, vendors, or extra roles.

## Technical Context

**Language/Version**: TypeScript 5.x (Astro 5, React 19) for `apps/Frontend` and `apps/Administration-FE`; Python 3.12 for `apps/Backend`

**Primary Dependencies**: Astro 5 (`output: 'static'`), `@astrojs/react`, `@astrojs/sitemap`, React 19, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, Argon2, boto3 (S3 API), openapi-typescript (or equivalent OpenAPI client generator), Playwright, Vitest, pytest, `@axe-core/playwright`, openapi-spec-validator

**Storage**: PostgreSQL 16 (administrators, sessions, managed records); S3-compatible object storage (MinIO locally) for social-preview media and published snapshots

**Testing**: Vitest (unit), pytest + HTTPX (API), Playwright (public no-JS + admin journeys), axe-core (WCAG 2.2 AA), OpenAPI validation, SEO/i18n/header custom gates, Lighthouse CI on representative public templates

**Target Platform**: Static public files on any HTTPS host; Administration FE + Backend behind the same HTTPS origin (`/admin`, `/api`); `deployment/` Docker Compose for local/preview parity

**Project Type**: Multi-surface web system (static public site + admin UI + HTTP API)

**Performance Goals**: Public foundation templates: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at p75 on a mid-range mobile profile; ≤ 150 KiB transfer (HTML+CSS+JS+fonts); 0 KiB JS and 0 third-party scripts on public foundation templates

**Constraints**: Public browsing MUST NOT require a live backend; Administration UI MUST be non-indexable and absent from the public sitemap; no invented company facts; no self-registration; secrets never in client assets; Conventional Commits; keep the implementation limited to this specification

**Scale/Scope**: Corporate marketing traffic (thousands of visits/day); a small number of provisioned staff; foundation ships one public locale (`en`), one placeholder public page template, one site-settings record, and stub contracts for later integrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
| --- | --- | --- |
| I. SEO and AEO First | Unique title/description/canonical, one `h1`, sitemap, robots, social-preview slots, organisation/webpage/FAQ JSON-LD templates without invented facts, extractable summary region | PASS |
| II. Native Elements First | Public templates are semantic HTML/CSS; React only on admin; no UI kit | PASS |
| III. Contract-First | OpenAPI 3.1 in `contracts/` is the single source of truth; Backend implements it; Frontend and Administration FE MUST consume and match it; gates reject drift | PASS |
| IV. Conventional Commits | Documented as the only allowed commit format (FR-039) | PASS |
| V. Internationalisation | Message keys; locale URL strategy; `lang`/`dir`; date/number-ready | PASS |
| VI. Performance by Default | Budgets in Technical Context; 0 public JS; 0 third-party scripts | PASS |
| VII. Core Web Vitals | Numeric targets above; Lighthouse CI on public templates; admin exempt from ranking vitals (FR-044) | PASS |
| VIII. Security by Default | HTTPS, headers, Argon2, HttpOnly session, CSRF, generic auth errors, classified secrets | PASS |
| IX. Accessibility | WCAG 2.2 AA, landmarks, skip link, visible focus, keyboard, field-level errors | PASS |
| X. Design Consistency | Shared token placeholders and documented layout regions only | PASS |
| XI. Responsive UI | Layout regions usable on mobile/tablet/desktop/large; touch/pointer/keyboard | PASS |
| XII. Production-Grade | Environments, `deployment/` compose, tests, headers, publish path, onboarding note | PASS |
| XIII. Quality Gates | Listed in research.md §12; failing gate blocks promotion | PASS |

No unjustified violations. Three applications exist because the specification requires three bounded surfaces, not because of optional layering.

### Post-design re-check

Phase 1 artifacts (`data-model.md`, `contracts/*`, `quickstart.md`, root `README.md`) stay inside the spec: one administrator capability, draft/publish only, stub integrations, no invented facts, public site bound at build time, OpenAPI-driven consumers. Gates above remain PASS.

## Contract consumption

OpenAPI files in `specs/001-website-foundation/contracts/` are the **single source of truth** for every cross-boundary shape.

| Consumer | How it MUST match the contract |
| --- | --- |
| **Backend** | Routers, request/response models, and the served `/openapi.json` MUST align with the published YAML; contract tests fail on drift |
| **Frontend** | Build-time types and snapshot validation MUST be generated from or validated against `content.v1`, `site-settings.v1`, `seo-metadata.v1`, and `publish.v1` schemas — no ad-hoc JSON shapes |
| **Administration FE** | API client and TypeScript types MUST be generated from `admin-auth.v1`, `admin-management.v1`, and `publish.v1` — no hand-written request/response types that bypass OpenAPI |

Quality gates MUST reject consumer changes that do not trace to the same contract revision the Backend implements.

## Project Structure

### Documentation (this feature)

```text
specs/001-website-foundation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output — OpenAPI single source of truth
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)

deployment/              # Shared Docker Compose + env (documented in root README.md)
```

### Source Code (repository root)

```text
README.md                         # Project overview, deployment, contracts, docs links
apps/
├── Frontend/                     # Public static site (Astro, no React hydration)
│   ├── src/
│   │   ├── pages/                # Public routes (pre-rendered)
│   │   ├── layouts/              # Document landmarks, skip link, regions
│   │   ├── components/           # Native HTML fragments only
│   │   ├── data/                 # Published snapshot consumed at build
│   │   ├── i18n/                 # Message catalogs (en)
│   │   ├── lib/                  # Metadata, sitemap, JSON-LD, contract-validated snapshot helpers
│   │   ├── generated/            # OpenAPI-derived types (from contracts/)
│   │   └── styles/               # tokens.css + layout
│   ├── public/                   # robots.txt, static assets
│   └── tests/
├── Administration-FE/            # Administration UI (Astro + React)
│   ├── src/
│   │   ├── pages/                # /admin sign-in + workspace
│   │   ├── layouts/
│   │   ├── components/           # React workspace, native controls
│   │   ├── lib/                  # OpenAPI-generated API client
│   │   ├── generated/            # OpenAPI-derived types (from contracts/)
│   │   ├── i18n/
│   │   └── styles/
│   └── tests/
└── Backend/                      # FastAPI
    ├── src/flycatch_api/
    │   ├── api/                  # Routers matching contracts
    │   ├── models/               # SQLAlchemy
    │   ├── schemas/              # Pydantic aligned to OpenAPI (single source of truth)
    │   ├── services/             # Auth, records, publish, object storage
    │   ├── security/             # Session, CSRF, headers, password
    │   └── cli/                  # Provision administrator
    ├── alembic/
    └── tests/
        ├── contract/
        ├── integration/
        └── unit/

deployment/                       # Shared deployment (see root README.md)
├── docker-compose.yml            # Frontend, Administration FE, Backend, PostgreSQL, MinIO, gateway
├── .env.example                  # Shared environment configuration
└── Caddyfile                     # Path split: / Frontend, /admin Administration FE, /api Backend

docs/
├── conventions.md                # Routes, naming, layout regions, quality checklist
└── onboarding.md                 # Local setup pointer + gate list
```

**Structure Decision**: Three applications (`apps/Frontend`, `apps/Administration-FE`, `apps/Backend`) map 1:1 to the spec’s public frontend, Administration UI, and backend. Display names: **Frontend**, **Administration FE**, **Backend**. Root `README.md` documents the project, deployment, and contract rules. Shared deployment in `deployment/` runs all services behind one gateway origin. OpenAPI in `specs/001-website-foundation/contracts/` is the single source of truth — Backend implements it; Frontend and Administration FE MUST generate or validate against the same files. No shared component package in this phase — only documented conventions and token placeholders.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Table left empty.
