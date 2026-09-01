---
description: "Task list for Website Foundation feature implementation"
---

# Tasks: Website Foundation

**Input**: Design documents from `/specs/001-website-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated checks are required by FR-042 but TDD is not mandated. Test tasks appear as implementation verification steps within each story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/Frontend/src/`
- **Administration FE**: `apps/Administration-FE/src/`
- **Backend**: `apps/Backend/src/flycatch_api/`
- **Deployment**: `deployment/`
- **Contracts**: `specs/001-website-foundation/contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the three-application monorepo and shared deployment skeleton

- [x] T001 Create monorepo directory structure per plan.md (`apps/Frontend/`, `apps/Administration-FE/`, `apps/Backend/`, `docs/`, `deployment/`)
- [x] T002 Initialize Astro 5 static project in `apps/Frontend/` with `output: 'static'`, TypeScript, and `@astrojs/sitemap`
- [x] T003 Initialize Astro 5 + React 19 project in `apps/Administration-FE/` with `@astrojs/react` and TypeScript
- [x] T004 Initialize FastAPI Python 3.12 project in `apps/Backend/` with `pyproject.toml`, `src/flycatch_api/`, and `alembic/`
- [x] T005 [P] Add shared token placeholders in `apps/Frontend/src/styles/tokens.css` and `apps/Administration-FE/src/styles/tokens.css`
- [x] T006 [P] Configure ESLint/Prettier for Frontend and Administration-FE (`apps/Frontend/`, `apps/Administration-FE/`)
- [x] T007 [P] Configure Ruff and pytest for Backend in `apps/Backend/pyproject.toml`
- [x] T008 [P] Add Dockerfiles for Frontend, Administration-FE, and Backend (`apps/Frontend/Dockerfile`, `apps/Administration-FE/Dockerfile`, `apps/Backend/Dockerfile`)
- [x] T009 Complete `deployment/compose/docker-compose.yml`, `deployment/k8s/base/Caddyfile`, and `deployment/compose/.env.example` for gateway path split (`/`, `/admin`, `/api`)
- [x] T010 Write root `README.md` with project overview, deployment usage, and contract consumption rules

**Checkpoint**: All three apps scaffolded; `docker compose -f deployment/compose/docker-compose.yml up` starts services (may serve placeholders)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 [P] Add contract validation script using `openapi-spec-validator` for all files in `specs/001-website-foundation/contracts/` (CI entry point)
- [x] T012 [P] Configure OpenAPI type generation for Frontend in `apps/Frontend/package.json` targeting `content.v1`, `site-settings.v1`, `seo-metadata.v1`, and `publish.v1` into `apps/Frontend/src/generated/`
- [x] T013 [P] Configure OpenAPI client generation for Administration FE in `apps/Administration-FE/package.json` targeting `admin-auth.v1`, `admin-management.v1`, and `publish.v1` into `apps/Administration-FE/src/generated/`
- [x] T014 Create Alembic config and initial migration for PostgreSQL in `apps/Backend/alembic/`
- [x] T015 [P] Implement SQLAlchemy `Administrator` model in `apps/Backend/src/flycatch_api/models/administrator.py`
- [x] T016 [P] Implement SQLAlchemy `AdminSession` model in `apps/Backend/src/flycatch_api/models/admin_session.py`
- [x] T017 [P] Implement SQLAlchemy `ManagedRecord` model in `apps/Backend/src/flycatch_api/models/managed_record.py`
- [x] T018 Create Pydantic schemas aligned to OpenAPI in `apps/Backend/src/flycatch_api/schemas/` (content, site-settings, seo-metadata, admin-auth, admin-management, publish)
- [x] T019 Implement FastAPI app factory with `/api/v1` router mount and security headers middleware in `apps/Backend/src/flycatch_api/main.py`
- [x] T020 [P] Implement Argon2 password hashing in `apps/Backend/src/flycatch_api/security/password.py`
- [x] T021 [P] Implement session cookie and CSRF helpers in `apps/Backend/src/flycatch_api/security/session.py` and `apps/Backend/src/flycatch_api/security/csrf.py`
- [x] T022 Implement S3-compatible object storage client in `apps/Backend/src/flycatch_api/services/object_storage.py`
- [x] T023 Implement administrator provisioning CLI in `apps/Backend/src/flycatch_api/cli/provision_admin.py`
- [x] T024 Seed initial `ManagedRecord` rows for `site_settings/default` and `page/home` with placeholder payloads in `apps/Backend/src/flycatch_api/cli/seed_records.py`
- [x] T025 Implement published snapshot export service writing to S3 and local path in `apps/Backend/src/flycatch_api/services/publish_export.py`
- [x] T026 Create seed published snapshot at `apps/Frontend/src/data/published.json` validated against OpenAPI schemas
- [x] T027 [P] Create English message catalogs in `apps/Frontend/src/i18n/en.json` and `apps/Administration-FE/src/i18n/en.json`
- [x] T028 Write route, naming, and layout conventions in `docs/conventions.md`
- [x] T029 Write local setup and quality-gate checklist in `docs/onboarding.md`
- [x] T030 Configure Vitest in `apps/Frontend/vitest.config.ts` and `apps/Administration-FE/vitest.config.ts`
- [x] T031 Configure pytest with HTTPX in `apps/Backend/tests/conftest.py`
- [x] T032 Configure Playwright in `apps/Frontend/tests/playwright.config.ts` (public) and `apps/Administration-FE/tests/playwright.config.ts` (admin)

**Checkpoint**: Foundation ready — database migrates, contracts validate, snapshot exists, user story implementation can begin

---

## Phase 3: User Story 1 — Visitor receives crawlable static content (Priority: P1) 🎯 MVP

**Goal**: Deliver a foundation home page as complete, pre-rendered HTML with SEO metadata, semantic structure, summary region, and zero client JavaScript

**Independent Test**: Build `apps/Frontend`, open the home route with scripting disabled, and verify unique title/description/canonical, one `h1`, summary region, readable content, and no dependency on Backend or Administration FE at browse time (quickstart V1)

### Implementation for User Story 1

- [x] T033 [P] [US1] Create base document layout with landmarks, skip-to-content link, and `lang`/`dir` in `apps/Frontend/src/layouts/BaseLayout.astro`
- [x] T034 [P] [US1] Implement metadata helper (title, description, canonical, social-preview slots) in `apps/Frontend/src/lib/metadata.ts`
- [x] T035 [P] [US1] Implement JSON-LD template builders (organization, web_page, faq) without invented facts in `apps/Frontend/src/lib/json-ld.ts`
- [x] T036 [P] [US1] Implement contract-validated snapshot loader in `apps/Frontend/src/lib/published-snapshot.ts` using `apps/Frontend/src/generated/`
- [x] T037 [P] [US1] Implement i18n message resolver in `apps/Frontend/src/lib/i18n.ts`
- [x] T038 [US1] Create foundation page template with header, main, summary, body, and footer regions in `apps/Frontend/src/layouts/PageTemplate.astro`
- [x] T039 [US1] Implement home route binding published snapshot and site settings in `apps/Frontend/src/pages/index.astro`
- [x] T040 [US1] Add layout CSS with token placeholders and reserved image dimensions in `apps/Frontend/src/styles/layout.css`
- [x] T041 [US1] Verify public foundation templates ship 0 KiB JavaScript (no React hydration, no third-party scripts) in `apps/Frontend/astro.config.mjs`
- [x] T042 [US1] Add Playwright journey for no-JS public page readability in `apps/Frontend/tests/e2e/public-no-js.spec.ts`
- [x] T043 [US1] Add axe-core accessibility check for home template in `apps/Frontend/tests/e2e/a11y-public.spec.ts`

**Checkpoint**: Home page is complete static HTML meeting US1 acceptance scenarios; public browsing does not require Backend

---

## Phase 4: User Story 2 — Developer scaffolds a new route (Priority: P1)

**Goal**: Document and enforce a repeatable path for adding placeholder public routes that inherit SEO, accessibility, and performance baselines without one-off exceptions

**Independent Test**: Add a second placeholder route per `docs/conventions.md`, confirm gates fail when metadata or `h1` is missing, then pass when restored (quickstart V2)

### Implementation for User Story 2

- [x] T044 [P] [US2] Extend `docs/conventions.md` with step-by-step new-route checklist (layout regions, metadata fields, message keys, sitemap inclusion)
- [x] T045 [P] [US2] Implement SEO metadata gate script (unique title/description/canonical, one `h1`) in `apps/Frontend/scripts/check-seo.mjs`
- [x] T046 [P] [US2] Implement i18n hard-coded string scan in `apps/Frontend/scripts/check-i18n.mjs`
- [x] T047 [US2] Add second placeholder public route `/about` using PageTemplate in `apps/Frontend/src/pages/about.astro`
- [x] T048 [US2] Wire quality-gate npm scripts in `apps/Frontend/package.json` (`check:seo`, `check:i18n`, `check:all`)
- [x] T049 [US2] Add Vitest test asserting gate failure on incomplete route metadata in `apps/Frontend/tests/unit/seo-gate.test.ts`
- [x] T050 [US2] Add internal link from home to `/about` in `apps/Frontend/src/pages/index.astro` per conventions

**Checkpoint**: A developer can add a route in under one hour using docs; gates block incomplete routes

---

## Phase 5: User Story 3 — Search engines discover public structure and skip administration (Priority: P2)

**Goal**: Public routes are discoverable via sitemap, robots rules, canonical addresses, and internal links; Administration UI is excluded from indexing

**Independent Test**: Inspect sitemap and robots from public build; verify all indexable routes listed, admin URLs absent, and admin responses are non-indexable (quickstart V3)

### Implementation for User Story 3

- [x] T051 [P] [US3] Configure `@astrojs/sitemap` for indexable public routes only in `apps/Frontend/astro.config.mjs`
- [x] T052 [P] [US3] Add `apps/Frontend/public/robots.txt` declaring public crawl rules and excluding `/admin` and `/api`
- [x] T053 [US3] Implement sitemap exclusion for non-indexable pages in `apps/Frontend/src/lib/sitemap-filter.ts`
- [x] T054 [US3] Add canonical URL builder using site settings `canonical_origin` in `apps/Frontend/src/lib/metadata.ts`
- [x] T055 [US3] Add admin non-indexable meta and headers documentation in `docs/conventions.md` (reference for Administration FE)
- [x] T056 [US3] Implement `noindex` layout meta and restrictive headers for admin shell in `apps/Administration-FE/src/layouts/AdminLayout.astro`
- [x] T057 [US3] Add SEO gate script verifying sitemap completeness and zero admin URLs in `apps/Frontend/scripts/check-sitemap.mjs`
- [x] T058 [US3] Add Playwright crawl test for sitemap routes and admin exclusion in `apps/Frontend/tests/e2e/discoverability.spec.ts`

**Checkpoint**: 100% indexable public routes in sitemap; 0% admin URLs; no orphan indexable pages

---

## Phase 6: User Story 4 — Administrator signs in and uses the Administration UI (Priority: P2)

**Goal**: Provisioned staff can sign in, edit placeholder records, save drafts, publish to update the public site, and sign out securely

**Independent Test**: Sign in, save draft (public unchanged), publish (public updates after rebuild), sign out (admin inaccessible) — under five minutes (quickstart V4)

### Implementation for User Story 4

- [x] T059 [P] [US4] Implement sign-in, session validation, and sign-out routes per `admin-auth.v1.yaml` in `apps/Backend/src/flycatch_api/api/admin_auth.py`
- [x] T060 [P] [US4] Implement managed record list/get/update draft routes per `admin-management.v1.yaml` in `apps/Backend/src/flycatch_api/api/admin_management.py`
- [x] T061 [US4] Implement publish route per `publish.v1.yaml` in `apps/Backend/src/flycatch_api/api/publish.py` (updates `published_payload`, writes S3 snapshot, triggers export)
- [x] T062 [US4] Implement auth dependency and CSRF enforcement for state-changing admin routes in `apps/Backend/src/flycatch_api/security/dependencies.py`
- [x] T063 [US4] Implement auth service (sign-in, session refresh, sign-out, generic errors) in `apps/Backend/src/flycatch_api/services/auth_service.py`
- [x] T064 [US4] Implement record service (draft save, publish, attribution fields) in `apps/Backend/src/flycatch_api/services/record_service.py`
- [x] T065 [P] [US4] Create admin sign-in page with accessible form and field-level errors in `apps/Administration-FE/src/pages/admin/sign-in.astro`
- [x] T066 [P] [US4] Create React sign-in form component using generated API client in `apps/Administration-FE/src/components/SignInForm.tsx`
- [x] T067 [US4] Create authenticated admin workspace layout regions in `apps/Administration-FE/src/layouts/AdminWorkspaceLayout.astro`
- [x] T068 [US4] Implement React workspace shell for record navigation in `apps/Administration-FE/src/components/AdminShell.tsx`
- [x] T069 [US4] Implement site-settings editor form in `apps/Administration-FE/src/components/SiteSettingsEditor.tsx`
- [x] T070 [US4] Implement home page content editor form in `apps/Administration-FE/src/components/PageEditor.tsx`
- [x] T071 [US4] Wire draft save and publish actions to generated client in `apps/Administration-FE/src/lib/admin-api.ts`
- [x] T072 [US4] Add unauthenticated redirect middleware for admin routes in `apps/Administration-FE/src/middleware/auth-guard.ts`
- [x] T073 [US4] Add Backend integration tests for sign-in, draft isolation, and publish in `apps/Backend/tests/integration/test_admin_flow.py`
- [x] T074 [US4] Add Playwright admin journey (sign-in → draft → publish → sign-out) in `apps/Administration-FE/tests/e2e/admin-draft-publish.spec.ts`
- [x] T075 [US4] Add axe-core check for admin sign-in and workspace in `apps/Administration-FE/tests/e2e/a11y-admin.spec.ts`
- [x] T076 [US4] Document publish-and-rebuild workflow (export snapshot → `astro build`) in `docs/onboarding.md`

**Checkpoint**: Draft changes invisible on public site until publish; sign-out ends session; generic auth errors

---

## Phase 7: User Story 5 — Integration author defines a backend contract (Priority: P3)

**Goal**: All nine integration boundaries have validated contracts; Backend implements or stubs them; Frontend and Administration FE consume matching generated types with drift detection

**Independent Test**: Contract validation passes for all YAML files; invalid contract fails gate; Backend served OpenAPI matches source; public build succeeds with Backend stopped (quickstart V5)

### Implementation for User Story 5

- [x] T077 [P] [US5] Add Backend contract conformance test comparing served `/openapi.json` to source YAML in `apps/Backend/tests/contract/test_openapi_parity.py`
- [x] T078 [P] [US5] Add Frontend generated-types drift check against contracts in `apps/Frontend/scripts/check-contract-drift.mjs`
- [x] T079 [P] [US5] Add Administration FE generated-client drift check in `apps/Administration-FE/scripts/check-contract-drift.mjs`
- [x] T080 [US5] Implement stub 501 routes for `form-submission.v1.yaml` and `newsletter.v1.yaml` in `apps/Backend/src/flycatch_api/api/stubs.py`
- [x] T081 [US5] Add analytics-events schema validation-only test in `apps/Backend/tests/contract/test_analytics_schema.py`
- [x] T082 [US5] Wire all contract and drift checks into root CI workflow (`.github/workflows/quality-gates.yml`)
- [x] T083 [US5] Add Vitest test confirming public build uses snapshot types only (no hand-written DTOs) in `apps/Frontend/tests/unit/contract-consumption.test.ts`

**Checkpoint**: SC-005 satisfied — every boundary has a validated contract; consumers match; stubs documented

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, security hardening, performance verification, and quickstart validation across all stories

- [x] T084 [P] Add security header verification script for public and admin responses in `scripts/check-security-headers.mjs`
- [x] T085 [P] Add secret-scan script rejecting server-only values in client bundles in `scripts/check-secrets.mjs`
- [x] T086 [P] Configure Lighthouse CI for representative public templates in `apps/Frontend/lighthouserc.json`
- [x] T087 Add performance budget check (≤ 150 KiB transfer, 0 KiB JS) in `apps/Frontend/scripts/check-performance-budget.mjs`
- [x] T088 Add preview/production HTML parity check for same snapshot revision in `apps/Frontend/scripts/check-build-parity.mjs`
- [x] T089 Add Backend unit tests for session expiry and inactive administrator in `apps/Backend/tests/unit/test_session_policy.py`
- [x] T090 Run full quickstart.md validation scenarios V1–V6 and record results in `docs/onboarding.md`
- [x] T091 Final review of root `README.md` and `docs/conventions.md` for FR-037/FR-038 completeness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (snapshot, generated types, i18n)
- **User Story 2 (Phase 4)**: Depends on US1 (PageTemplate and home route exist)
- **User Story 3 (Phase 5)**: Depends on US1–US2 (multiple indexable routes and conventions)
- **User Story 4 (Phase 6)**: Depends on Foundational; integrates with US1 via publish → snapshot → rebuild
- **User Story 5 (Phase 7)**: Depends on Foundational; full drift checks depend on all consumers existing (best completed after US1 and US4)
- **Polish (Phase 8)**: Depends on all desired user stories

### User Story Dependencies

| Story | Priority | Depends on | Independent test |
| --- | --- | --- | --- |
| US1 | P1 | Phase 2 | No-JS home page with complete metadata |
| US2 | P1 | US1 | New route + gates fail/pass |
| US3 | P2 | US1, US2 | Sitemap/robots/admin exclusion |
| US4 | P2 | Phase 2 | Draft/publish/sign-out journey |
| US5 | P3 | Phase 2 (+ consumers from US1/US4) | Contract validation + no drift |

### Within Each User Story

- Layout and lib helpers before pages
- Backend services before API routes (US4)
- Generated types before snapshot loaders and admin forms
- Core implementation before Playwright/axe verification

### Parallel Opportunities

- **Phase 1**: T005–T008 can run in parallel after T001–T004
- **Phase 2**: T011–T013 (contract tooling), T015–T017 (models), T020–T021 (security), T027 (i18n) in parallel
- **Phase 3**: T033–T037 (layout, lib modules) in parallel
- **Phase 4**: T044–T046 (docs + gate scripts) in parallel
- **Phase 5**: T051–T052 (sitemap + robots) in parallel
- **Phase 6**: T059–T060 (auth + management routes), T065–T066 (sign-in UI) in parallel after services
- **Phase 7**: T077–T079 (drift checks) in parallel
- **Phase 8**: T084–T086 in parallel

---

## Parallel Example: User Story 1

```bash
# Launch lib modules together:
Task: "Implement metadata helper in apps/Frontend/src/lib/metadata.ts"
Task: "Implement JSON-LD template builders in apps/Frontend/src/lib/json-ld.ts"
Task: "Implement contract-validated snapshot loader in apps/Frontend/src/lib/published-snapshot.ts"
Task: "Implement i18n message resolver in apps/Frontend/src/lib/i18n.ts"

# Then sequentially:
Task: "Create foundation page template in apps/Frontend/src/layouts/PageTemplate.astro"
Task: "Implement home route in apps/Frontend/src/pages/index.astro"
```

---

## Parallel Example: User Story 4

```bash
# Backend routes in parallel (different files):
Task: "Implement admin-auth routes in apps/Backend/src/flycatch_api/api/admin_auth.py"
Task: "Implement admin-management routes in apps/Backend/src/flycatch_api/api/admin_management.py"

# Admin UI pages in parallel:
Task: "Create sign-in page in apps/Administration-FE/src/pages/admin/sign-in.astro"
Task: "Create SignInForm component in apps/Administration-FE/src/components/SignInForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart V1 — home page is complete static HTML without Backend
5. Deploy/demo static Frontend if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Static crawlable home page (**MVP**)
3. US2 → Repeatable route scaffolding + gates
4. US3 → SEO discoverability + admin exclusion
5. US4 → Staff can draft and publish content
6. US5 → Contract drift CI fully enforced
7. Polish → All quality gates green

### Parallel Team Strategy

With multiple developers after Phase 2:

- **Developer A**: US1 → US2 → US3 (public Frontend track)
- **Developer B**: US4 (Backend auth/publish + Administration FE)
- **Developer C**: US5 + Polish (contract CI and cross-cutting gates)

US4 Backend API work can start as soon as Phase 2 completes, in parallel with US1.

---

## Notes

- OpenAPI files in `specs/001-website-foundation/contracts/` already exist — do not rewrite them; validate and consume them
- `[P]` tasks = different files, no dependencies on incomplete tasks in the same batch
- `[Story]` label maps task to specific user story for traceability
- Public pages MUST remain 0 KiB JavaScript; React is Administration FE only
- Publish completion requires snapshot export **and** documented Frontend rebuild
- Commit using Conventional Commits (FR-039)
- Stop at any checkpoint to validate story independently before proceeding
