# Quickstart: Website Foundation

**Feature**: `001-website-foundation`  
**Date**: 2026-08-14  
**Purpose**: Runnable validation that the foundation works end-to-end. Implementation details belong in `tasks.md`.

Related artifacts: [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [plan.md](./plan.md), [README.md](../../README.md).

## Prerequisites

- Node.js 22 LTS and pnpm
- Python 3.12
- Docker and Docker Compose
- A provisioned administrator (created with the Backend CLI; no self-registration)

## Setup

1. Copy environment config: `cp deployment/.env.example deployment/.env` and adjust values.
2. Start all services: `docker compose -f deployment/docker-compose.yml up -d` (see [README.md](../../README.md#deployment)).
3. Apply Backend migrations and provision one active administrator.
4. Generate OpenAPI consumers for Frontend and Administration FE from `specs/001-website-foundation/contracts/`; confirm Backend served OpenAPI matches the same files.
5. Export the published snapshot (empty or seed `home` + `site_settings`) into `apps/Frontend/src/data/published.json`.
6. Build `apps/Frontend` with `astro build` (`output: 'static'`).
7. Rebuild compose services when app images change: `docker compose -f deployment/docker-compose.yml up -d --build`.
8. Open the gateway origin from `.env` (default `http://localhost:8080`): `/` → Frontend, `/admin` → Administration FE, `/api` → Backend.

Do not point the public site at live API URLs for ordinary browsing.

## Validation scenarios

### V1 — Public page is complete static HTML (US1, SC-008)

1. Build `apps/Frontend`. Open the foundation route with scripting disabled.
2. **Expect**: Unique title, meta description, canonical, exactly one `h1`, summary region, internal link. Content and navigation remain readable.
3. **Expect**: No requirement that `apps/Administration-FE` or `apps/Backend` are running.

### V2 — New public route inherits gates (US2, SC-007)

1. Add a placeholder public route using `docs/conventions.md` (layout, metadata helpers, message keys).
2. Omit title or `h1` and run quality gates.
3. **Expect**: Gates fail; route is not promotable.
4. Restore required metadata and rebuild.
5. **Expect**: Route is static HTML consistent with the existing foundation route.

### V3 — Discoverability and admin exclusion (US3, SC-003, SC-009)

1. Inspect `/sitemap.xml` from the public build.
2. **Expect**: Every indexable public foundation route is listed and returns 200. Zero `/admin` or `/api` URLs.
3. Inspect `robots.txt` and admin document metadata/headers.
4. **Expect**: Public routes may be indexed; Administration UI is `noindex` and not a public landing page.
5. Request `/admin` while signed out.
6. **Expect**: Sign-in only; no staff content, no draft payloads.

### V4 — Sign-in, draft, publish, sign-out (US4, SC-010)

1. Sign in with the provisioned administrator (see [admin-auth.v1.yaml](./contracts/admin-auth.v1.yaml)).
2. **Expect**: Workspace with documented layout regions.
3. Edit the placeholder site-settings or `home` page; save draft (see [admin-management.v1.yaml](./contracts/admin-management.v1.yaml)).
4. Rebuild/serve public site from the **previous** snapshot.
5. **Expect**: Public HTML still shows the last published version.
6. Publish (see [publish.v1.yaml](./contracts/publish.v1.yaml)); export snapshot; rebuild `apps/Frontend`.
7. **Expect**: Public HTML shows the new published values only after that path completes.
8. Sign out; request `/admin` again.
9. **Expect**: No administration content. Unsaved edits do not publish themselves.

### V5 — Contracts exist and consumers match (US5, SC-005)

1. Run contract validation on every file in [contracts/](./contracts/).
2. **Expect**: All nine boundaries validate. An incomplete or invalid file fails the gate.
3. Compare Backend served OpenAPI and Frontend/Administration FE generated types against the same source YAML.
4. **Expect**: No drift; hand-written DTOs that bypass OpenAPI fail the gate.
5. Confirm public build still succeeds with Backend stopped.

### V6 — Accessibility, i18n, security, performance

1. Run axe on public foundation templates and admin sign-in/workspace (SC-001).
2. Scan templates for hard-coded user-facing strings (SC-004).
3. Confirm security headers on public and admin responses; admin additionally restricts indexing and framing.
4. Confirm public foundation JS budget is 0 and Lighthouse/CWV targets in [plan.md](./plan.md) are met (SC-002).
5. Sign in with wrong credentials.
6. **Expect**: Generic failure; no hint whether the account exists.

## Quality-gate checklist (before calling work complete)

- [ ] Static production build of `apps/Frontend` is green
- [ ] Contract validation green; Backend and Frontend/Administration FE match OpenAPI source
- [ ] Unit + integration + Playwright journeys green (including no-JS public and admin draft/publish)
- [ ] axe: zero critical WCAG 2.2 AA violations
- [ ] SEO checks: metadata, one `h1`, sitemap completeness, admin exclusion
- [ ] i18n scan clean
- [ ] Header and secret checks clean
- [ ] Preview and production builds of the same snapshot revision produce equivalent public HTML

## Environments

| Environment | Public HTML | Admin / API |
| --- | --- | --- |
| Local | `docker compose -f deployment/docker-compose.yml up` | Gateway origin from `.env` |
| Preview | Same build command, HTTPS | HTTPS, production-like headers |
| Production | Same build command, cacheable assets, invalidate on new published revision | HTTPS, idle session timeout enforced |

Hosting vendor choice is out of scope; parity of the **HTML production path** is not.
