# Onboarding: Website Foundation and Staff Auth

## Local setup

Docker Compose starts Frontend, Administration FE, Backend, PostgreSQL, MinIO, and the gateway. It does **not** create staff users or apply migrations. There is no default login and no sign-up screen.

1. `cp deployment/.env.example deployment/.env` and set `JWT_SECRET` (and other `change-me` values) to long random secrets. Do not commit `deployment/.env`.
2. `docker compose -f deployment/docker-compose.yml up -d --build`
3. Backend migrations: `docker compose -f deployment/docker-compose.yml exec backend alembic upgrade head`
4. Seed records: `docker compose -f deployment/docker-compose.yml exec backend flycatch-seed-records`
5. Bootstrap default roles and two staff users:

   ```bash
   docker compose -f deployment/docker-compose.yml exec backend flycatch-bootstrap \
     --user-1-email admin1@example.com \
     --user-2-email admin2@example.com \
     --user-2-role editor
   ```

   | Example identity | Role |
   | --- | --- |
   | `admin1@example.com` | `administrator` (always user 1) |
   | `admin2@example.com` | `editor` (from `--user-2-role`) |

   These emails are examples only. Passwords are **not** stored in the repo: they are prompted (minimum 12 characters) unless you pass `--user-1-password` and `--user-2-password`. Re-running with the same emails is idempotent and does not change existing passwords. Pytest fixtures (`editor1@example.com` / test passwords) are not created by this command.

6. Later staff: `docker compose -f deployment/docker-compose.yml exec backend flycatch-provision-admin --email someone@example.com --role editor` (`--role` is required: `administrator` or `editor`).
7. Generate Administration FE types: `cd apps/Administration-FE && npm run generate:client`
8. Build Frontend: `cd apps/Frontend && pnpm install && pnpm run build`

Gateway: `http://localhost:8080` (`/` Frontend, `/admin` Administration FE, `/api` Backend). Sign in at `/admin` with the emails and passwords you chose at bootstrap.

Tokens stay in Administration FE memory and are sent as `Authorization: Bearer`.

## Publish-and-rebuild workflow

1. Sign in to `/admin`
2. Edit record and **Save draft** (public site unchanged)
3. **Publish** record via API (requires `records.publish`)
4. Export snapshot: `GET /api/v1/published/snapshot` (with `BUILD_EXPORT_TOKEN` in non-local envs)
5. Write to `apps/Frontend/src/data/published.json`
6. Rebuild Frontend: `pnpm run build` in `apps/Frontend`
7. Redeploy Frontend container

## Quality-gate checklist

- [ ] Static production build of `apps/Frontend` is green
- [ ] Contract validation green (`node scripts/validate-contracts.mjs`, includes `specs/002-auth-rbac/contracts/`)
- [ ] Frontend checks: `pnpm run check:all`
- [ ] Backend tests: `pytest` in `apps/Backend` (bootstrap, sign-in, refresh, grant, deny)
- [ ] Playwright journeys (public no-JS + admin sign-in/grant/deny)
- [ ] axe: zero critical WCAG 2.2 AA violations on sign-in and denial
- [ ] SEO checks: metadata, one `h1`, sitemap completeness, admin exclusion
- [ ] i18n scan clean
- [ ] Header and secret checks clean (no JWT secrets, password hashes, or tokens in client bundles)
- [ ] Preview and production builds of same snapshot revision produce equivalent public HTML

## Validation results (implementation)

| Scenario | Status | Notes |
| --- | --- | --- |
| V1 Public static HTML | Pending local run | Build with `pnpm run build`; verify no-JS |
| V2 Route gates | Implemented | `check:seo`, `check:i18n` scripts |
| V3 Discoverability | Implemented | sitemap, robots.txt, admin noindex |
| V4 Admin draft/publish | Implemented | Bearer + RBAC on Backend + Administration FE |
| V5 Contracts | Implemented | validate-contracts.mjs covers 001 and 002 OpenAPI |
| V6 Cross-cutting | Partial | Lighthouse CI config; run locally |

### 002-auth-rbac quickstart (V1–V6)

| Scenario | Status | Notes |
| --- | --- | --- |
| V1 Bootstrap defaults | Implemented | `test_bootstrap.py`: two users, catalogue, idempotent re-run, no secrets in CLI stdout |
| V2 Password sign-in / sign-out | Implemented | `test_admin_auth.py` + AdminShell in-memory tokens; generic 401; no sign-up control |
| V3 Refresh required | Implemented | Rotation, reuse revokes family, idle/absolute expiry → 401 |
| V4 Authorised actions | Implemented | `test_rbac_grant.py`: administrator and multi-role union can view, draft, publish |
| V5 Denied publish | Implemented | `test_rbac_deny.py`: editor draft 200, direct publish 403, no-auth 401 |
| V6 Contracts / i18n / a11y / public | Implemented | OpenAPI parity, generate:client, check-i18n, axe specs, existing sitemap/JS budget scripts |
