---
description: "Task list for Authentication and Authorisation (RBAC) feature implementation"
---

# Tasks: Authentication and Authorisation (RBAC)

**Input**: Design documents from `/specs/002-auth-rbac/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: FR-030 and constitution XIII require quality gates (bootstrap, sign-in success/generic failure, grant, deny including a direct request, contract validation). TDD is not mandated. Test tasks appear as verification steps at the end of each story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Administration FE**: `apps/Administration-FE/src/`
- **Backend**: `apps/Backend/src/flycatch_api/`
- **Frontend**: `apps/Frontend/` (non-regression only)
- **Deployment**: `deployment/`
- **Contracts**: `specs/002-auth-rbac/contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire JWT/RBAC dependencies, secrets, contract consumers, and CLI entry points onto the existing three-app monorepo

- [x] T001 Add `PyJWT` to Backend dependencies in `apps/Backend/pyproject.toml`
- [x] T002 [P] Add `jwt_secret` and `jwt_access_minutes` (default 15) settings in `apps/Backend/src/flycatch_api/config.py`
- [x] T003 [P] Add `JWT_SECRET` and `JWT_ACCESS_MINUTES` placeholders (no well-known staff passwords) in `deployment/compose/.env.example`
- [x] T004 [P] Point Administration FE OpenAPI generation at `admin-auth.v2`, `admin-rbac.v1`, `admin-management.v2`, and `publish.v2` in `apps/Administration-FE/scripts/generate-client.mjs` and `apps/Administration-FE/package.json`
- [x] T005 [P] Extend `scripts/validate-contracts.mjs` to validate OpenAPI YAML under `specs/002-auth-rbac/contracts/` (skip `bootstrap.cli.yaml`)
- [x] T006 Register `flycatch-bootstrap` console script in `apps/Backend/pyproject.toml`
- [x] T007 [P] Add any missing sign-in, session-expired, and permission-denied message keys in `apps/Administration-FE/src/i18n/en.json`

**Checkpoint**: Backend can import PyJWT; contract validator covers 002 OpenAPI files; Administration FE generate script targets 002 contracts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Roles, refresh-session schema, JWT helpers, request-time RBAC, and in-memory token storage that ALL user stories require

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create Alembic migration for `roles`, `role_permissions`, `administrator_roles`, and refresh-session columns (`refresh_token_hash`, `family_id`) on `admin_sessions` in `apps/Backend/alembic/versions/002_rbac_refresh_session.py`
- [x] T009 [P] Implement SQLAlchemy `Role` model (`name` unique slug) in `apps/Backend/src/flycatch_api/models/role.py`
- [x] T010 [P] Implement SQLAlchemy `RolePermission` model (permission enum `records.view` / `drafts.save` / `records.publish`) in `apps/Backend/src/flycatch_api/models/role_permission.py`
- [x] T011 [P] Implement SQLAlchemy `AdministratorRole` model in `apps/Backend/src/flycatch_api/models/administrator_role.py`
- [x] T012 Evolve `AdminSession` into the hashed refresh-token session (`refresh_token_hash`, `family_id`, idle 30 minutes, absolute 12 hours) in `apps/Backend/src/flycatch_api/models/admin_session.py`
- [x] T013 Wire new models and `Administrator` relationships in `apps/Backend/src/flycatch_api/models/__init__.py` and `apps/Backend/src/flycatch_api/models/administrator.py`
- [x] T014 Create Pydantic schemas for `TokenPair`, `SessionContext`, `AuthError`, and `PermissionDenied` aligned to 002 contracts in `apps/Backend/src/flycatch_api/schemas/admin_auth.py` and `apps/Backend/src/flycatch_api/schemas/admin_rbac.py`
- [x] T015 [P] Implement HS256 access-JWT issue/verify (`sub`, `sid`, `typ=access`, `iat`, `exp`, `jti`; no roles or permissions) in `apps/Backend/src/flycatch_api/security/jwt.py`
- [x] T016 Implement request-time RBAC (union of assigned role permissions; current assignments only) in `apps/Backend/src/flycatch_api/services/rbac_service.py`
- [x] T017 Replace cookie/CSRF staff auth with Bearer principal plus `require_permission` in `apps/Backend/src/flycatch_api/security/dependencies.py`
- [x] T018 Remove Administration CSRF route and cookie-session staff mechanism from `apps/Backend/src/flycatch_api/api/admin_management.py`, `apps/Backend/src/flycatch_api/security/csrf.py`, and `apps/Backend/src/flycatch_api/security/session.py`
- [x] T019 Add JWT + hashed-refresh primitives (issue pair, rotate, family revoke, hash with `session_secret`) in `apps/Backend/src/flycatch_api/services/auth_service.py`
- [x] T020 [P] Implement in-memory access + refresh token store (no `localStorage`, `sessionStorage`, or cookies) in `apps/Administration-FE/src/lib/token-store.ts`

**Checkpoint**: Migration applies; JWT can be issued and verified; RBAC can compute a permission union; Foundation cookie/CSRF is no longer the staff auth path

---

## Phase 3: User Story 1 — Operator bootstraps default users and roles (Priority: P1) 🎯 MVP

**Goal**: An operator can run `flycatch-bootstrap` once to create Administrator and Editor roles plus at least two staff users with assignments, idempotently and without leaking secrets

**Independent Test**: On an empty environment, run bootstrap with two identities and secrets; confirm two active users, roles `administrator` (view+draft+publish) and `editor` (view+draft only), and assignments. Re-run with the same emails and confirm zero duplicates. There is no sign-up screen (quickstart V1)

### Implementation for User Story 1

- [x] T021 [US1] Implement fail-closed, idempotent bootstrap (default roles, ≥2 users, user 1 always `administrator`, user 2 role flag default `administrator`) in `apps/Backend/src/flycatch_api/services/bootstrap_service.py`
- [x] T022 [US1] Implement `flycatch-bootstrap` CLI (flags/prompts per `bootstrap.cli.yaml`; never log secrets) in `apps/Backend/src/flycatch_api/cli/bootstrap.py`
- [x] T023 [US1] Require `--role` (`administrator` | `editor`) on later provisioning in `apps/Backend/src/flycatch_api/cli/provision_admin.py`
- [x] T024 [US1] Document bootstrap and required `--role` provisioning in `docs/onboarding.md`
- [x] T025 [US1] Add integration tests for two users, catalogue permissions, idempotent re-run, partial-user create, fail-closed missing inputs, and no secrets in stdout in `apps/Backend/tests/integration/test_bootstrap.py`

**Checkpoint**: `flycatch-bootstrap` creates the default set; a second run reports defaults already exist; Editor never receives `records.publish`

---

## Phase 4: User Story 2 — Provisioned staff member signs in with a password (Priority: P1)

**Goal**: Bootstrapped staff sign in with email/password, receive access + refresh tokens in memory, reach the workspace without a full-page reload, and sign out; failures stay generic and create no session

**Independent Test**: Sign in with a valid bootstrapped account (200 + both tokens + session roles/permissions). Retry with a wrong password and an unknown email — same generic error, zero sessions. Confirm no sign-up control. Sign out and confirm further admin requests are 401 (quickstart V2, V3)

### Implementation for User Story 2

- [x] T026 [US2] Implement `POST /admin/auth/sign-in`, `POST /admin/auth/refresh`, `POST /admin/auth/sign-out`, and `GET /admin/auth/session` per `admin-auth.v2.yaml` in `apps/Backend/src/flycatch_api/api/admin_auth.py`
- [x] T027 [US2] Complete password sign-in in `apps/Backend/src/flycatch_api/services/auth_service.py` (generic 401 for wrong password / unknown email / inactive; both tokens on success; no refresh row on failure)
- [x] T028 [US2] Complete refresh rotation (new pair, old hash revoked, family revoke on reuse, idle/absolute expiry → 401) in `apps/Backend/src/flycatch_api/services/auth_service.py`
- [x] T029 [P] [US2] Generate Administration FE types/client from 002 contracts into `apps/Administration-FE/src/generated/`
- [x] T030 [US2] Rewrite the admin HTTP client as Bearer-only with refresh-once on 401 (no `credentials: 'include'`, no CSRF) in `apps/Administration-FE/src/lib/admin-api.ts`
- [x] T031 [US2] Update `SignInForm` to write tokens to memory and switch to the workspace in the same document (no `window.location`) in `apps/Administration-FE/src/components/SignInForm.tsx`
- [x] T032 [US2] Convert `AdminShell` to one-island auth state (signed-out form ↔ workspace; sign-out revokes then clears memory) in `apps/Administration-FE/src/components/AdminShell.tsx`
- [x] T033 [US2] Remove cookie-based redirects and separate sign-in navigation from `apps/Administration-FE/src/pages/admin/index.astro` and `apps/Administration-FE/src/pages/admin/sign-in.astro`
- [x] T034 [US2] Confirm the sign-in UI has no register / create-account / sign-up control in `apps/Administration-FE/src/components/SignInForm.tsx`
- [x] T035 [US2] Add Backend tests for token pair, generic failure, inactive-as-unknown, refresh rotation, and idle/absolute expiry in `apps/Backend/tests/integration/test_admin_auth.py` and `apps/Backend/tests/unit/test_session_policy.py`
- [x] T036 [US2] Add Playwright journey for sign-in success, generic failure, no sign-up, and sign-out in `apps/Administration-FE/tests/e2e/admin-auth.spec.ts`
- [x] T037 [US2] Extend axe-core WCAG 2.2 AA check for the sign-in state in `apps/Administration-FE/tests/e2e/a11y-admin.spec.ts`

**Checkpoint**: Valid password reaches the workspace with in-memory tokens; failed attempts look identical and create 0 sessions; reload is treated as signed out

---

## Phase 5: User Story 3 — Authorised staff member performs an allowed action (Priority: P2)

**Goal**: A signed-in user whose roles include the required permission can view records, save drafts, and publish; the workspace shows only allowed controls; multi-role permissions are a union

**Independent Test**: Sign in as the Administrator (or a user with view+draft+publish); open a placeholder record, save a draft, and publish. Each step succeeds. Public HTML stays on the previous snapshot until the documented rebuild (quickstart V4)

### Implementation for User Story 3

- [x] T038 [US3] Enforce `records.view` on GET and `drafts.save` on PATCH in `apps/Backend/src/flycatch_api/api/admin_management.py`
- [x] T039 [US3] Enforce `records.publish` on `POST /admin/publish` in `apps/Backend/src/flycatch_api/api/publish.py`
- [x] T040 [US3] Return current role names and effective permissions on sign-in, refresh, and `GET /admin/auth/session` (loaded at request time, not from JWT claims) in `apps/Backend/src/flycatch_api/services/auth_service.py`
- [x] T041 [P] [US3] Show draft/publish controls from session permissions in `apps/Administration-FE/src/components/AdminShell.tsx`, `apps/Administration-FE/src/components/SiteSettingsEditor.tsx`, and `apps/Administration-FE/src/components/PageEditor.tsx`
- [x] T042 [US3] Add integration tests that an Administrator (and a multi-role user) can view, draft, and publish in `apps/Backend/tests/integration/test_rbac_grant.py`
- [x] T043 [US3] Update the Playwright draft→publish journey to use Bearer tokens in `apps/Administration-FE/tests/e2e/admin-draft-publish.spec.ts`

**Checkpoint**: A user with publish can complete the existing draft/publish path; union of multiple roles is honoured

---

## Phase 6: User Story 4 — Staff member is denied an action they are not permitted to perform (Priority: P2)

**Goal**: Missing permissions are refused on the server (403 while still signed in). The workspace hides or disables the control. Unauthenticated callers get 401, never 403

**Independent Test**: Sign in as Editor (view+draft, no publish). Draft save works. Publish control is absent or clearly disabled. Direct `POST /admin/publish` returns 403 `permission_denied` for `records.publish` and does not change the public site. The same URL with no `Authorization` returns 401 (quickstart V5)

### Implementation for User Story 4

- [x] T044 [US4] Return 403 `PermissionDenied` (`code`, `admin.action.forbidden`, required permission) when authenticated but missing the permission, and 401 (never 403) when unauthenticated or inactive, in `apps/Backend/src/flycatch_api/security/dependencies.py`
- [x] T045 [US4] Omit or `disabled` + `aria-disabled` the publish control when `records.publish` is absent; denial copy uses `admin.action.forbidden` in `apps/Administration-FE/src/components/AdminShell.tsx` and `apps/Administration-FE/src/components/PageEditor.tsx`
- [x] T046 [US4] Add integration tests: Editor draft succeeds; direct publish is 403 and site unchanged; session still valid; no-auth publish is 401 in `apps/Backend/tests/integration/test_rbac_deny.py`
- [x] T047 [US4] Add Playwright Editor deny journey (UI + accessible denial) in `apps/Administration-FE/tests/e2e/admin-rbac-deny.spec.ts`
- [x] T048 [US4] Extend axe-core WCAG 2.2 AA check for the permission-denied state in `apps/Administration-FE/tests/e2e/a11y-admin.spec.ts`

**Checkpoint**: Editor cannot publish via UI or direct request; they remain signed in and can still draft; unauthenticated is 401

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Contract parity, i18n/a11y/public non-regression, operator docs, and full quickstart validation

- [x] T049 [P] Update Backend OpenAPI parity tests to assert served `/openapi.json` matches `specs/002-auth-rbac/contracts/` in `apps/Backend/tests/contract/test_openapi_parity.py`
- [x] T050 [P] Update Administration FE contract-drift check to reject hand-written token/permission DTOs in `apps/Administration-FE/scripts/check-contract-drift.mjs`
- [x] T051 [P] Scan Administration FE sign-in and denial UI for hard-coded user-facing strings in `apps/Administration-FE/scripts/check-i18n.mjs` (or existing Frontend i18n scan pattern)
- [x] T052 [P] Confirm public sitemap/robots still exclude `/admin` and `/api` and public JS budget remains 0 in `apps/Frontend/scripts/check-sitemap.mjs` and `apps/Frontend/scripts/check-performance-budget.mjs`
- [x] T053 Include `002-auth-rbac` contract validation and admin auth/RBAC tests in `.github/workflows/quality-gates.yml`
- [x] T054 Update staff-auth docs (JWT + Bearer, no cookie/CSRF, no sign-up) in `docs/conventions.md` and `README.md`
- [x] T055 Reject tokens, password hashes, and JWT secrets in client bundles and ordinary logs via `scripts/check-secrets.mjs`
- [x] T056 Run `specs/002-auth-rbac/quickstart.md` scenarios V1–V6 and record results in `docs/onboarding.md`

**Checkpoint**: All FR-030 quality gates pass; public delivery is unchanged; contracts and consumers match

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (models, RBAC catalogue)
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 (bootstrapped users to sign in)
- **User Story 3 (Phase 5)**: Depends on US2 (Bearer session + session permissions payload)
- **User Story 4 (Phase 6)**: Depends on US2; shares permission enforcement with US3 (can start after T038–T039)
- **Polish (Phase 7)**: Depends on all desired user stories

### User Story Dependencies

| Story | Priority | Depends on | Independent test |
| --- | --- | --- | --- |
| US1 | P1 | Phase 2 | Bootstrap two users + default roles; idempotent re-run; no sign-up |
| US2 | P1 | Phase 2, US1 | Password sign-in + generic failure + sign-out + refresh |
| US3 | P2 | US2 | Administrator view → draft → publish |
| US4 | P2 | US2 (US3 enforcement helpers) | Editor draft OK; publish denied in UI and direct POST |

### Within Each User Story

- Models and services before CLIs and HTTP routes
- Generated types before Administration FE client rewrite
- Token store before Bearer client and island auth state
- Core implementation before Playwright/axe verification
- Story complete before moving to the next priority when staffing is sequential

### Parallel Opportunities

- **Phase 1**: T002–T005 and T007 can run in parallel after T001
- **Phase 2**: T009–T011 (models) and T015 + T020 (JWT + token-store) can run in parallel after T008 starts
- **Phase 3**: T024 (docs) can run in parallel with T021–T023
- **Phase 4**: T029 (codegen) can run in parallel with T026–T028 (Backend auth)
- **Phase 5**: T038 and T039 (management vs publish enforcement) can run in parallel
- **Phase 6**: T046–T048 (Backend deny tests vs Playwright/axe) can run in parallel after T044–T045
- **Phase 7**: T049–T052 can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational models exist:
Task: "Implement bootstrap service in apps/Backend/src/flycatch_api/services/bootstrap_service.py"
Task: "Document bootstrap in docs/onboarding.md"

# Then sequentially:
Task: "Implement flycatch-bootstrap CLI in apps/Backend/src/flycatch_api/cli/bootstrap.py"
Task: "Require --role on provision_admin.py"
Task: "Add integration tests in apps/Backend/tests/integration/test_bootstrap.py"
```

---

## Parallel Example: User Story 2

```bash
# Backend auth and FE codegen in parallel:
Task: "Implement admin-auth.v2 routes in apps/Backend/src/flycatch_api/api/admin_auth.py"
Task: "Generate types into apps/Administration-FE/src/generated/"

# Then FE client + island (same token-store, sequential with each other):
Task: "Rewrite Bearer client in apps/Administration-FE/src/lib/admin-api.ts"
Task: "Update SignInForm.tsx and AdminShell.tsx for in-memory session"
```

---

## Parallel Example: User Story 3

```bash
# Route enforcement in parallel (different files):
Task: "Enforce view/draft in apps/Backend/src/flycatch_api/api/admin_management.py"
Task: "Enforce publish in apps/Backend/src/flycatch_api/api/publish.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart V1 — two users, two roles, idempotent bootstrap, no secrets leaked
5. Demo operator bootstrap before building the JWT workspace

### Incremental Delivery

1. Setup + Foundational → JWT/RBAC machinery ready
2. US1 → Bootstrap defaults (**MVP**)
3. US2 → Password sign-in + refresh + in-memory Bearer session
4. US3 → Authorised view/draft/publish
5. US4 → Server-enforced deny + accessible UI denial
6. Polish → Contract parity, i18n/a11y, public non-regression, full V1–V6

### Parallel Team Strategy

With multiple developers after Phase 2:

- **Developer A**: US1 (bootstrap CLI + provision `--role`)
- **Developer B**: US2 Backend auth routes + AuthService (after US1 users exist, or using provision)
- **Developer C**: US2 Administration FE token-store / island (after T020 and codegen)

US3 and US4 should wait for US2 Bearer session. After T038–T039, grant and deny verification can proceed in parallel.

---

## Notes

- OpenAPI files in `specs/002-auth-rbac/contracts/` already exist — do not rewrite them; implement and consume them
- Foundation payload schemas (`content.v1`, `site-settings.v1`, `seo-metadata.v1`) stay in `specs/001-website-foundation/contracts/`
- `[P]` tasks = different files, no dependencies on incomplete tasks in the same batch
- `[Story]` label maps task to a specific user story for traceability
- Access JWT MUST NOT contain roles or permissions; enforcement is request-time
- Tokens live in Administration FE memory only; a full document navigation after sign-in is a defect
- `apps/Frontend` is out of change scope except non-regression gates
- No Administration UI for user or role management in this feature
- Commit using Conventional Commits (constitution IV)
- Stop at any checkpoint to validate the story independently before proceeding
