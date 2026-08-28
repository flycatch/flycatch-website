# Quickstart: Cloud Services & Migrations

## Prerequisites

Database migrated through revision `020`. Staff user with `cloud_services.read` and `cloud_services.create`.

## Validate

1. `GET /api/v1/admin/cloud-services` — 200, `per_page` 10.
2. `POST` with `page_name: cloud-services` — 201, draft.
3. Duplicate `page_name` — 422.
4. `PATCH` with `status: publish`.
5. `GET /api/v1/public/cloud-services/cloud-services` — 200, no `status`.

See [contracts/admin-cloud-services.v1.yaml](./contracts/admin-cloud-services.v1.yaml) and [contracts/public-cloud-services.v1.yaml](./contracts/public-cloud-services.v1.yaml).
