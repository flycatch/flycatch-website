# Quickstart: Authentication and Authorisation (RBAC)

**Feature**: `002-auth-rbac`  
**Date**: 2026-08-14  
**Purpose**: Runnable validation that staff JWT auth and RBAC work end-to-end. Implementation details belong in `tasks.md`.

Related artifacts: [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [plan.md](./plan.md), [research.md](./research.md).

## Prerequisites

- Foundation stack running (see [001-website-foundation/quickstart.md](../001-website-foundation/quickstart.md))
- Node.js 22 LTS, Python 3.12, Docker Compose
- Operator-chosen emails and passwords for **two** staff users (minimum 12 characters). Do not use committed defaults.

## Setup

1. Copy or update `deployment/compose/.env` with `jwt_secret` (long random) in addition to existing Backend secrets.
2. Start services: `docker compose -f deployment/compose/docker-compose.yml up -d --build` (see [README.md](../../README.md#quick-start-docker-compose)).
3. Apply Backend migrations (includes roles and refresh-session columns).
4. Run bootstrap (see [bootstrap.cli.yaml](./contracts/bootstrap.cli.yaml)). Prefix with `docker compose -f deployment/compose/docker-compose.yml exec backend` when using Compose:

   ```bash
   flycatch-bootstrap \
     --user-1-email admin1@example.com \
     --user-2-email admin2@example.com \
     --user-2-role editor
   ```

   Those emails are examples only; there is no committed default password. Supply passwords via prompt or flags (min 12 characters). Expect two users and roles `administrator` / `editor`. Re-run with the same emails and expect no duplicates.

5. Generate Administration FE types/client from `specs/002-auth-rbac/contracts/` (`admin-auth.v2`, `admin-rbac.v1`, `admin-management.v2`, `publish.v2`). Confirm Backend served OpenAPI matches those files.
6. Open the gateway origin `/admin`. Expect sign-in only — no register or create-account control.

Do not store issued tokens in `localStorage`, `sessionStorage`, or cookies. The Administration FE MUST keep them in memory and send `Authorization: Bearer <access_token>`.

## Validation scenarios

### V1 — Bootstrap defaults (US1, SC-001, SC-006)

1. On an empty staff table, run bootstrap with two identities and secrets.
2. **Expect**: Two active users; role `administrator` has view + draft + publish; role `editor` has view + draft only.
3. Run bootstrap again with the same emails.
4. **Expect**: Zero duplicate users or roles; command reports defaults already exist.
5. Inspect logs and public HTML.
6. **Expect**: No passwords, refresh tokens, or JWT secrets.

### V2 — Password sign-in and sign-out (US2, SC-002, SC-003, SC-004)

1. Sign in as user 1 with the correct password ([admin-auth.v2.yaml](./contracts/admin-auth.v2.yaml)).
2. **Expect**: `200` with `access_token`, `refresh_token`, `token_type: bearer`, and `session.roles` / `session.permissions`. Workspace renders without a full page reload.
3. Confirm subsequent admin requests include `Authorization: Bearer` and do not send an `admin_session` cookie.
4. Sign in with a wrong password, then with an unknown email, then as an inactive user (if you deactivate a fixture).
5. **Expect**: Same generic error and message key; zero refresh sessions created.
6. Confirm the sign-in screen has no sign-up action.
7. Sign out.
8. **Expect**: Refresh session revoked; further admin requests are 401; workspace is not usable until sign-in.

### V3 — Refresh token is required (FR-004, plan input)

1. Sign in; wait for or force access-token expiry (15 minutes, or a test clock).
2. Perform a protected GET. The client MUST call `POST /admin/auth/refresh` with the in-memory refresh token and retry.
3. **Expect**: New token pair; original refresh hash revoked; work continues.
4. Repeat refresh after idle (30 minutes) or absolute (12 hours) expiry.
5. **Expect**: 401; treated as signed out. Unsaved edits do not publish.

### V4 — Authorised actions (US3, SC-005)

1. Sign in as the Administrator user.
2. View site settings and the `home` page; save a draft; publish ([admin-management.v2.yaml](./contracts/admin-management.v2.yaml), [publish.v2.yaml](./contracts/publish.v2.yaml)).
3. **Expect**: Each step succeeds. Public HTML still shows the previous published snapshot until the documented rebuild.

### V5 — Denied publish (US4, SC-005, SC-007)

1. Sign in as the Editor user (or user 2 if bootstrapped with `--user-2-role editor`).
2. **Expect**: Draft save works. Publish control is absent or clearly disabled; denial copy uses `admin.action.forbidden`.
3. Send `POST /api/v1/admin/publish` directly with the Editor access token.
4. **Expect**: `403` `permission_denied` for `records.publish`; published site unchanged; `GET /admin/auth/session` still succeeds (still signed in).
5. Request the same publish URL with no `Authorization` header.
6. **Expect**: `401` (not 403); no staff content, roles, or permissions in the body.

### V6 — Contracts, i18n, accessibility, public non-regression (SC-008, SC-009)

1. Validate every file in [contracts/](./contracts/) with openapi-spec-validator (skip `bootstrap.cli.yaml` as CLI, not OpenAPI).
2. Compare Backend served OpenAPI and Administration FE generated types to the same YAML.
3. **Expect**: No drift; no hand-written token/permission DTOs.
4. Scan sign-in and denial UI for hard-coded user-facing strings.
5. Run axe on sign-in and a permission-denied state (WCAG 2.2 AA, zero critical).
6. Rebuild `apps/Frontend` and confirm sitemap/robots still exclude `/admin` and `/api`; public JS budget remains 0.

## Quality gates (must pass before complete)

- Bootstrap idempotency and fail-closed missing inputs
- Sign-in success returns both tokens; generic failure creates 0 sessions
- Refresh rotation and idle/absolute expiry
- Bearer required on protected routes
- Permission grant (Administrator publish) and denial (Editor direct publish)
- Contract parity for 002 OpenAPI files
- Message keys + axe AA on sign-in and denial
- Public non-regression (no admin leakage, no public JS)

## Out of this guide

Implementation of routers, migrations, token-store code, and full test suites belongs in `tasks.md` and the implementation phase.
