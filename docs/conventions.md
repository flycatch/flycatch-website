# Conventions: Website Foundation

## Public routes

- Place pages in `apps/Frontend/src/pages/`
- Use `PageTemplate.astro` for foundation routes
- Bind content from `apps/Frontend/src/data/published.json` via `getPageBySlug()`
- Externalise user-facing strings in `apps/Frontend/src/i18n/en.json`
- Every indexable page MUST have: unique title, description, canonical, exactly one `h1`

## New route checklist

1. Add page payload to published snapshot (or publish via Administration UI)
2. Create `apps/Frontend/src/pages/{route}.astro` using `PageTemplate`
3. Add message keys to `en.json`
4. Add internal link from an existing indexable page
5. Run `pnpm run check:all` in `apps/Frontend`

## Administration UI

- Routes under `apps/Administration-FE/src/pages/admin/`
- MUST include `<meta name="robots" content="noindex, nofollow">`
- React hydration only in admin workspace components
- API calls through `apps/Administration-FE/src/lib/admin-api.ts`

## Naming

| Item | Pattern |
| --- | --- |
| Public routes | `/`, `/about`, kebab-case |
| Admin routes | `/admin`, `/admin/sign-in` |
| Contracts | `{boundary}.v1.yaml` |
| Message keys | dot.namespaced (`page.home.summary`) |

## Layout regions

**Public**: header, nav, main (h1, summary, body), footer, skip-to-content

**Admin**: header, nav, main workspace, skip-to-content

## Quality gates

See `docs/onboarding.md` and `specs/001-website-foundation/quickstart.md`.
