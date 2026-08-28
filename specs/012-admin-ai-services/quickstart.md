# Quickstart: AI Services

## Prerequisites

Database migrated through revision `019`. Staff user with `ai_services.read` and `ai_services.create`.

## Validate

1. `GET /api/v1/admin/ai-services` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish` and `solution_ids`.
4. `GET /api/v1/public/ai-services/{slug}` — 200, nested published solutions, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-ai-services.v1.yaml](./contracts/admin-ai-services.v1.yaml) and [contracts/public-ai-services.v1.yaml](./contracts/public-ai-services.v1.yaml).
