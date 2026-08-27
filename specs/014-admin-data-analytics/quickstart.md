# Quickstart: Data Analytics & Migration

## Prerequisites

Database migrated through revision `021`. Staff user with `data_analytics.read` and `data_analytics.create`.

## Validate

1. `GET /api/v1/admin/data-analytics` — 200, `per_page` 10.
2. `POST` with `page_name: cloud-services` — 201, draft.
3. Duplicate `page_name` — 422.
4. `PATCH` with `status: publish`.
5. `GET /api/v1/public/data-analytics/cloud-services` — 200, no `status`.

See [contracts/admin-data-analytics.v1.yaml](./contracts/admin-data-analytics.v1.yaml) and [contracts/public-data-analytics.v1.yaml](./contracts/public-data-analytics.v1.yaml).
