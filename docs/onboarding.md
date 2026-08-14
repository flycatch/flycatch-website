# Onboarding: Website Foundation

## Local setup

1. `cp deployment/.env.example deployment/.env`
2. `docker compose -f deployment/docker-compose.yml up -d --build`
3. Backend migrations: `docker compose -f deployment/docker-compose.yml exec backend alembic upgrade head`
4. Seed records: `docker compose -f deployment/docker-compose.yml exec backend flycatch-seed-records`
5. Provision admin: `docker compose -f deployment/docker-compose.yml exec backend flycatch-provision-admin --email admin@example.com`
6. Build Frontend: `cd apps/Frontend && pnpm install && pnpm run build`

Gateway: `http://localhost:8080` (`/` Frontend, `/admin` Administration FE, `/api` Backend)

## Publish-and-rebuild workflow

1. Sign in to `/admin`
2. Edit record and **Save draft** (public site unchanged)
3. **Publish** record via API
4. Export snapshot: `GET /api/v1/published/snapshot` (with `BUILD_EXPORT_TOKEN` in non-local envs)
5. Write to `apps/Frontend/src/data/published.json`
6. Rebuild Frontend: `pnpm run build` in `apps/Frontend`
7. Redeploy Frontend container

## Quality-gate checklist

- [ ] Static production build of `apps/Frontend` is green
- [ ] Contract validation green (`node scripts/validate-contracts.mjs`)
- [ ] Frontend checks: `pnpm run check:all`
- [ ] Backend tests: `pytest` in `apps/Backend`
- [ ] Playwright journeys (public no-JS + admin draft/publish)
- [ ] axe: zero critical WCAG 2.2 AA violations
- [ ] SEO checks: metadata, one `h1`, sitemap completeness, admin exclusion
- [ ] i18n scan clean
- [ ] Header and secret checks clean
- [ ] Preview and production builds of same snapshot revision produce equivalent public HTML

## Validation results (implementation)

| Scenario | Status | Notes |
| --- | --- | --- |
| V1 Public static HTML | Pending local run | Build with `pnpm run build`; verify no-JS |
| V2 Route gates | Implemented | `check:seo`, `check:i18n` scripts |
| V3 Discoverability | Implemented | sitemap, robots.txt, admin noindex |
| V4 Admin draft/publish | Implemented | Backend + Administration FE |
| V5 Contracts | Implemented | validate-contracts.mjs + stubs |
| V6 Cross-cutting | Partial | Lighthouse CI config; run locally |
