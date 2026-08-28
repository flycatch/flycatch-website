# Quickstart: Infrastructure Management & Automation

## Prerequisites

Database migrated through revision `024`. Staff user with `infrastructure_management.read` and `infrastructure_management.create`.

## Validate

1. `GET /api/v1/admin/infrastructure-management` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/infrastructure-management/{slug}` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-infrastructure-management.v1.yaml](./contracts/admin-infrastructure-management.v1.yaml) and [contracts/public-infrastructure-management.v1.yaml](./contracts/public-infrastructure-management.v1.yaml).
