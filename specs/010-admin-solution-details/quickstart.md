# Quickstart: Solution Details

## Prerequisites

Database migrated through revision `015`. Staff user with `solution_details.read` and `solution_details.create`.

## Validate

1. `GET /api/v1/admin/solution-details` — 200, `per_page` 10.
2. `POST` with `{ "title": "Retail", "slug": "retail" }` — 201, draft.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/solution-details/retail` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-solution-details.v1.yaml](./contracts/admin-solution-details.v1.yaml) and [contracts/public-solution-details.v1.yaml](./contracts/public-solution-details.v1.yaml).
