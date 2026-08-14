# Research: Website Foundation

**Feature**: `001-website-foundation`  
**Date**: 2026-08-14  
**Status**: Complete — all Technical Context items resolved

The requested stack listed **“Astron”**. This plan uses **[Astro](https://astro.build)** (the static-first web framework) with React via `@astrojs/react`. That reading matches the specification: public pages MUST be complete pre-rendered HTML and MUST remain usable without client-side scripting. No other product named “Astron” fits those constraints.

---

## 1. Public frontend framework

**Decision**: Astro 5 with `output: 'static'`. React 19 is available through `@astrojs/react` but MUST NOT hydrate public content. Public foundation templates are Astro/HTML/CSS only.

**Rationale**: FR-001 and FR-002 require complete HTML and usable journeys when scripting is unavailable. Astro emits static files and ships zero JavaScript by default. React on public pages would add a runtime the constitution (II, VI, VII) and the spec both reject unless a later feature justifies an island.

**Alternatives considered**:

- **Next.js (React SSG/RSC)**: Can pre-render HTML but still orients around a React runtime. Harder to guarantee zero-JS public pages and larger default payload.
- **Vite + React SPA**: Client-rendered by default; fails FR-001/FR-002 without a separate SSG layer.
- **Plain HTML files**: Meets static delivery but lacks shared layouts, metadata helpers, and quality-gate hooks the developer-route story requires.

---

## 2. Administration UI framework

**Decision**: Separate Astro 5 app (`apps/Administration-FE`) that hydrates a React 19 workspace (`client:load` on the admin shell only). Admin routes live under `/admin` and are never part of the public sitemap.

**Rationale**: The user asked for React + Astro on both surfaces. The Administration UI is an authenticated workspace (sign-in, draft, publish), so React is justified there. Keeping it a second Astro app preserves one toolchain while honouring FR-047 (separate URL space, layout, navigation).

**Alternatives considered**:

- **Same Astro project, `/admin` routes**: Weaker layer boundary; easier to leak admin links or JS into public builds.
- **Vite + React SPA only**: Valid for an app, but diverges from the requested Astro stack and duplicates config.
- **Server-rendered admin in FastAPI templates**: Mixes presentation into the backend and fights contract-first separation (FR-005, FR-055).

---

## 3. Backend

**Decision**: FastAPI (Python 3.12) exposing versioned OpenAPI 3.1 contracts under `/api/v1`. SQLAlchemy 2 + Alembic for PostgreSQL. Pydantic v2 for request/response models generated from or kept aligned with the contracts.

**Rationale**: Contract-first is mandatory (constitution III, FR-034). FastAPI publishes OpenAPI natively, so quality gates can validate the same machine-readable files consumers use. Python 3.12 is current stable and well supported.

**Alternatives considered**:

- **Django**: Heavier admin product baked in; conflicts with “Administration UI is a separate surface.”
- **Express/NestJS**: Would split languages; user specified FastAPI.
- **No backend in foundation**: Rejected — sign-in, draft/publish, and contracts are in scope.

---

## 4. Database

**Decision**: PostgreSQL 16. Persist administrators, sessions, and managed records (site settings + one placeholder page) with draft and published JSON payloads. No Redis, search engine, or extra data stores.

**Rationale**: User-specified. Relational tables fit provisioned users, sessions, and attributable draft/publish state (FR-050, FR-054). JSON payloads keep the placeholder content model small until a later spec defines real content types.

**Alternatives considered**:

- **SQLite**: Fine for a demo, weaker preview/production parity (FR-041).
- **Document DB**: Unnecessary for this record shape.
- **Content only in Git**: Blocks the Administration UI draft/publish path.

---

## 5. File storage

**Decision**: S3-compatible object storage (MinIO locally; any S3 API in preview/production). Used for the social-preview image slot and the published content snapshot the public build reads. Access keys are server-only.

**Rationale**: User-specified. Public pages cannot call S3 at browse time (FR-009). The build/publish pipeline downloads the published snapshot; visitors receive only static files.

**Alternatives considered**:

- **Filesystem-only media**: Breaks preview/production parity and FR-004 cache/invalidation story.
- **Serving media from FastAPI at browse time**: Makes public browsing depend on the API (FR-009).

---

## 6. Session and sign-in

**Decision**: Server-backed session in PostgreSQL. Session id in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie on the shared origin. Passwords hashed with Argon2. Idle timeout 30 minutes; absolute lifetime 12 hours. CSRF: synchronizer token for state-changing admin requests. Failed sign-in returns the same generic error (FR-046). No self-registration; a CLI provisions the first administrator.

**Rationale**: Matches FR-045/FR-046/FR-048 and the spec assumption of a confidential session (not social login). Cookie + same origin avoids storing tokens in `localStorage`.

**Alternatives considered**:

- **JWT in localStorage**: Conflicts with FR-046 and CSRF guidance.
- **SSO/OAuth**: Explicitly deferred by the spec.
- **Separate admin and API hostnames with cross-site cookies**: More moving parts than a single-origin reverse proxy.

---

## 7. Publish path and static content binding

**Decision**: Publish is an admin API operation that (1) copies the draft payload to the published payload in PostgreSQL, (2) writes a versioned snapshot to S3, and (3) is complete only after a documented static rebuild of `apps/Frontend` from that snapshot. Ordinary public browsing never calls the API.

**Rationale**: FR-003, FR-009, FR-051. Visitors must see only published HTML. Drafts must not be reachable as public URLs.

**Alternatives considered**:

- **On-demand SSR of public pages**: Violates static delivery (FR-001, constraints).
- **ISR/runtime fetch from the API**: Public browsing would require the backend.
- **Admin writes HTML files directly**: Couples admin to public templates and skips contracts.

---

## 8. Contract format and consumption

**Decision**: OpenAPI 3.1 YAML in `specs/001-website-foundation/contracts/` is the **single source of truth**. One file per FR-034 boundary, versioned in the path (`/v1`) and filename (`*.v1.yaml`). Stubs for form, newsletter, and analytics (no runtime implementation this phase).

**Consumer rules**:

- **Backend** implements the contracts; served OpenAPI MUST match the source YAML.
- **Frontend** MUST validate build-time data (published snapshot, content/settings shapes) against the same OpenAPI component schemas — generated TypeScript types from `content.v1`, `site-settings.v1`, `seo-metadata.v1`, and `publish.v1`.
- **Administration FE** MUST use an OpenAPI-generated API client and types from `admin-auth.v1`, `admin-management.v1`, and `publish.v1` — no parallel hand-written DTOs.

**Gates**: `openapi-spec-validator`; Backend contract conformance tests; consumer drift checks (regenerate/compare generated artifacts).

**Rationale**: Constitution III and FR-034–FR-036, FR-055. One authoritative schema prevents silent coupling between surfaces.

**Alternatives considered**:

- **TypeScript types as source of truth**: Rejected — not cross-language and breaks Backend-first contract-first order.
- **GraphQL schema**: Extra runtime and not required.
- **Single mega-spec**: Harder to change one boundary without noise.

---

## 9. Internationalisation

**Decision**: One shipped locale (`en`). All user-facing strings are message keys in JSON files (`apps/Frontend/src/i18n/en.json`, `apps/Administration-FE/src/i18n/en.json`). Quality gate fails on hard-coded copy in templates. Locale URL strategy: default locale has no prefix; additional locales later use `/{locale}/` without renaming existing default paths. `dir` and `lang` on `<html>`; layout regions do not assume LTR-only geometry.

**Rationale**: FR-027–FR-029 and constitution V. Externalising now avoids a rewrite.

**Alternatives considered**:

- **Hard-coded English**: Fails FR-027 and SC-004.
- **Prefixed default locale (`/en/`) now**: Unnecessary URL churn for a single-locale launch.

---

## 10. Styling and design system

**Decision**: Native HTML plus CSS custom properties as token placeholders (colour, type, space, focus). No component library and no CSS-in-JS. Shared token file copied or duplicated as a thin `tokens.css` in each UI app. Brand values stay placeholders.

**Rationale**: Constitution II, X; spec defers exact brand. A UI kit would add weight and custom abstractions the foundation does not need.

**Alternatives considered**:

- **Tailwind / Ant Design / MUI**: Extra dependency and styling model not required for layout regions.
- **Shared component package in this phase**: Premature; two small apps can share tokens and conventions in docs.

---

## 11. Repository structure

**Decision**: Three applications plus shared deployment at the repo root:

- `apps/Frontend` — public Astro static site
- `apps/Administration-FE` — Administration UI
- `apps/Backend` — FastAPI
- `deployment/` — Docker Compose, `.env.example`, gateway config (documented in root [README.md](../../README.md))

OpenAPI in `specs/001-website-foundation/contracts/` is the single source of truth. Backend implements; Frontend and Administration FE MUST consume and match. One gateway origin in each environment: `/` Frontend, `/admin` Administration FE, `/api` Backend.

**Rationale**: FR-005 and FR-037. Three app directories match three bounded surfaces. One `deployment/` folder keeps compose and environment config shared and simple.

**Alternatives considered**:

- **Single app**: Violates surface separation.
- **`infra/` split from apps**: Rejected — user requires one common `deployment/` folder for all services.
- **Yarn/pnpm packages for every helper**: Over-structure for foundation.
- **Subdomain-per-surface**: Extra DNS/cookie work; path split is enough.

---

## 12. Testing and quality gates

**Decision**:

| Layer | Tools |
| --- | --- |
| API unit/integration | pytest, HTTPX |
| Contract validation | openapi-spec-validator; Backend served OpenAPI vs source YAML; Frontend/Administration FE generated types vs source YAML |
| Public + admin unit | Vitest |
| Browser journeys | Playwright (public with JS disabled; admin sign-in/draft/publish) |
| Accessibility | `@axe-core/playwright`, WCAG 2.2 AA |
| SEO/AEO | Custom checks: unique title/description/canonical, one `h1`, sitemap membership, admin exclusion |
| i18n | Lint/scan for literal user-facing strings in templates |
| Performance | Documented budgets; Lighthouse CI on representative public templates (mobile profile) |
| Security | Header checks; secret scan; no server-only keys in client bundles |

Promotion is blocked when any gate fails (FR-041, FR-043, SC-006).

**Rationale**: Maps directly to FR-042 and success criteria SC-001–SC-010.

**Alternatives considered**:

- **Cypress**: Overlaps Playwright; Playwright’s no-JS context is a better fit for FR-002.
- **Manual-only a11y/SEO**: Fails constitution XIII.

---

## 13. Environments and hosting

**Decision**: Hosting vendor is out of scope (spec). Local/preview/production MUST share the same HTML production path: export published snapshot → `astro build` in `apps/Frontend` → deploy static files with cache-busting. All foundation services (Frontend, Administration FE, Backend, PostgreSQL, object storage) share `deployment/docker-compose.yml` and `.env` configuration. Gateway provides one origin (`/`, `/admin`, `/api`).

**Rationale**: FR-004, FR-030, FR-041. Equivalent public HTML for the same revision in preview and production. One deployment folder avoids duplicated compose/env setup.

**Alternatives considered**:

- **Per-app compose files**: Rejected — user requires shared deployment.
- **Different render modes per environment**: Forbidden by the preview/production drift edge case.
- **Choosing Vercel/Netlify/Cloudflare now**: Spec defers vendors.

---

## 14. Performance budgets (public)

**Decision** (foundation templates, production build, gzip/brotli transfer):

| Budget | Limit |
| --- | --- |
| Total page weight (HTML+CSS+JS+fonts, excluding content images) | ≤ 150 KiB |
| JavaScript | 0 KiB on public foundation templates |
| Third-party scripts | 0 |
| Core Web Vitals (p75, mid-range mobile) | LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 |

Images (when a slot is filled later) MUST reserve width/height. System font stack in foundation to protect LCP. Administration UI is exempt from ranking vitals (FR-044) but MUST stay usable on supported viewports.

**Rationale**: FR-019–FR-022, SC-002, constitution VI–VII.

**Alternatives considered**:

- **Allow a small React island on public pages “just in case”**: Unjustified weight (FR-022).

---

## Clarifications resolved

| Item | Resolution |
| --- | --- |
| “Astron” | Astro (`astro.build`) + React integration |
| Public JS | None on foundation templates |
| Auth product | Provisioned admin + cookie session; no SSO |
| Publish completion | Snapshot in DB/S3 + documented static rebuild |
| Shared origin | `/`, `/admin`, `/api` |
| Extra infrastructure | None (no Redis, queue, or search) |
