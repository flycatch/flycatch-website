# Quickstart: Digital Transformation

## Prerequisites

Database migrated through revision `022`. Staff user with `digital_transformation.read` and `digital_transformation.create`.

## Validate

1. `GET /api/v1/admin/digital-transformation` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/digital-transformation/{slug}` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-digital-transformation.v1.yaml](./contracts/admin-digital-transformation.v1.yaml) and [contracts/public-digital-transformation.v1.yaml](./contracts/public-digital-transformation.v1.yaml).
