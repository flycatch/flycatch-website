# Implementation Plan: Authentication and Authorisation (RBAC)

**Branch**: `002-auth-rbac` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-auth-rbac/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

**Plan input**: Use JWT auth with required refresh tokens. Store both tokens in frontend memory and send the access token via `Authorization: Bearer`.

## Summary

Add staff password sign-in with **JWT access tokens and required refresh tokens**, plus minimal RBAC (Administrator / Editor over view, draft, and publish) and an operator bootstrap that creates those roles and at least two users. The Administration FE keeps both tokens in **memory only** and sends the access token as `Authorization: Bearer`. The Backend validates the JWT, then evaluates **current** role assignments on every protected action. Foundation cookie sessions and CSRF synchronizer tokens are superseded. Public static delivery is unchanged.

## Technical Context

**Language/Version**: TypeScript 5.x (Astro 5, React 19) for `apps/Administration-FE`; Python 3.12 for `apps/Backend`. `apps/Frontend` is out of change scope except non-regression.

**Primary Dependencies**: Existing foundation stack plus **PyJWT** (HS256) on the Backend. Argon2 remains for passwords. Administration FE uses an OpenAPI-generated client from this feature’s contracts. No Redis, no UI kit, no new public JS.

**Storage**: PostgreSQL 16 — extend with `roles`, `role_permissions`, `administrator_roles`; evolve `admin_sessions` into the hashed **refresh-token session** (idle 30 minutes, absolute 12 hours, rotation). Access JWTs are not persisted.

**Testing**: pytest + HTTPX (unit/integration/contract), Vitest, Playwright (admin sign-in, grant, deny including direct publish), `@axe-core/playwright` (WCAG 2.2 AA), openapi-spec-validator, i18n hard-coded-string scan. Public Playwright/Lighthouse gates remain non-regression.

**Target Platform**: Same as foundation — Administration FE + Backend behind one HTTPS origin (`/admin`, `/api`); public site static.

**Project Type**: Multi-surface web system (extend Backend + Administration FE only)

**Performance Goals**: Public foundation budgets unchanged (0 KiB JS, LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1). Administration: sign-in on a typical office connection in under 30 seconds (SC-002); no new public payload.

**Constraints**: No self-registration; no durable browser storage of tokens; no permissions in JWT claims; no well-known bootstrap passwords; Editor MUST NOT receive publish; Bearer-only admin API (no session cookie); fail-closed bootstrap; Conventional Commits.

**Scale/Scope**: Small provisioned staff set; two default roles; three permissions mapped to existing admin actions; one bootstrap CLI; no user-management UI.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
| --- | --- | --- |
| I. SEO and AEO First | Administration remains `noindex` and absent from the public sitemap; no admin links on anonymous public pages | PASS |
| II. Native Elements First | Sign-in stays a native form; no UI kit; in-memory token store is required by Bearer transport, not a parallel widget library | PASS |
| III. Contract-First | OpenAPI 3.1 in `specs/002-auth-rbac/contracts/` published before consumers change; breaking auth/management/publish get v2 files | PASS |
| IV. Conventional Commits | Unchanged project rule | PASS |
| V. Internationalisation | Sign-in, validation, and denial use message keys only (`en` catalogue) | PASS |
| VI. Performance by Default | Zero new public JS; admin adds no third-party UI runtime | PASS |
| VII. Core Web Vitals | Public targets unchanged; admin exempt from ranking vitals (foundation FR-044) | PASS |
| VIII. Security by Default | Argon2; generic auth errors; hashed refresh; short-lived JWT; request-time RBAC; secrets not in HTML/logs/durable client storage; Bearer not auto-sent cross-site | PASS |
| IX. Accessibility | WCAG 2.2 AA on sign-in and denial; labels, field errors, keyboard, focus | PASS |
| X. Design Consistency | Reuse Administration layout regions and existing controls | PASS |
| XI. Responsive UI | Existing admin shell remains usable across viewports | PASS |
| XII. Production-Grade | Refresh rotation, fail-closed bootstrap, contract tests, operator CLI | PASS |
| XIII. Quality Gates | Bootstrap, sign-in success/generic failure, grant, deny (including direct request), contract parity | PASS |

No unjustified violations. JWT + refresh is the mandated session design, not an extra product surface.

### Post-design re-check

Phase 1 artifacts (`research.md`, `data-model.md`, `contracts/*`, `quickstart.md`) stay inside the spec: staff-only password auth, no sign-up, two default roles, three permissions, operator bootstrap, request-time enforcement. Public contracts and Frontend templates are not rewritten. Gates above remain PASS.

## Contract consumption

OpenAPI files in `specs/002-auth-rbac/contracts/` are the **single source of truth** for this feature’s cross-boundary shapes. Foundation payload schemas (`content.v1`, `site-settings.v1`, `seo-metadata.v1`) remain in `specs/001-website-foundation/contracts/` and are referenced, not duplicated.

| Consumer | How it MUST match the contract |
| --- | --- |
| **Backend** | Auth, management, and publish routers implement the v2/v1 files in this directory; served `/openapi.json` MUST align; cookie `admin_session` and CSRF MUST NOT remain the staff auth mechanism |
| **Administration FE** | API client and TypeScript types MUST be generated from `admin-auth.v2`, `admin-rbac.v1`, `admin-management.v2`, and `publish.v2` — no hand-written token or permission DTOs |
| **Frontend** | No new runtime contract; public snapshot contracts unchanged |

Quality gates MUST reject consumer changes that do not trace to the same contract revision the Backend implements.

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-rbac/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output — OpenAPI + bootstrap CLI
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/
├── Frontend/                         # Unchanged except non-regression gates
├── Administration-FE/
│   ├── src/
│   │   ├── components/               # Sign-in + workspace in one island; permission-aware controls
│   │   ├── lib/
│   │   │   ├── token-store.ts        # In-memory access + refresh (new)
│   │   │   └── admin-api.ts          # Bearer client; refresh-once on 401
│   │   ├── generated/                # Types from specs/002-auth-rbac/contracts/
│   │   └── i18n/en.json              # Denial / sign-in keys
│   └── tests/
│       ├── e2e/                      # Sign-in, grant, deny, no sign-up
│       └── unit/
└── Backend/
    ├── src/flycatch_api/
    │   ├── api/
    │   │   ├── admin_auth.py         # sign-in, refresh, sign-out, session
    │   │   ├── admin_management.py   # Bearer + records.view / drafts.save
    │   │   └── publish.py            # Bearer + records.publish
    │   ├── models/                   # Role, RolePermission, AdministratorRole; session = refresh
    │   ├── schemas/                  # Pydantic aligned to 002 contracts
    │   ├── services/
    │   │   ├── auth_service.py       # Password + JWT + refresh rotation
    │   │   └── rbac_service.py       # Union permissions; request-time check
    │   ├── security/
    │   │   ├── jwt.py                # Issue / verify access JWT
    │   │   └── dependencies.py       # Bearer principal + require_permission
    │   └── cli/
    │       ├── bootstrap.py          # flycatch-bootstrap (new)
    │       └── provision_admin.py    # Required --role
    ├── alembic/versions/             # 002 roles + refresh-session columns
    └── tests/
        ├── contract/
        ├── integration/
        └── unit/

deployment/                           # jwt_secret + access TTL in .env.example only
```

**Structure Decision**: Keep the foundation’s three applications. This feature changes `apps/Backend` and `apps/Administration-FE` only. No fourth app. Contracts for this feature live under `specs/002-auth-rbac/contracts/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Table left empty.
