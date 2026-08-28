# Quickstart: Overview

## Prerequisites

Database migrated through revision `024`. Staff user with `overview.read` and `overview.create`.

## Validate

1. `GET /api/v1/admin/overview` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/overview/{slug}` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-overview.v1.yaml](./contracts/admin-overview.v1.yaml) and [contracts/public-overview.v1.yaml](./contracts/public-overview.v1.yaml).
