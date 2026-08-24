# Quickstart: Solutions

## Prerequisites

Database migrated through revision `014`. Staff user with `solutions.read` and `solutions.create`.

## Validate

1. Sign in and `GET /api/v1/admin/solutions` — 200, `per_page` 10.
2. `POST /api/v1/admin/solutions` with `{ "banner_title": "Our work" }` — 201, `status` draft.
3. `PATCH` with `status: publish` — published.
4. `GET /api/v1/public/solutions` without auth — includes the row; omits `status` and `id`.
5. Draft solutions are absent from the public list.

See [contracts/admin-solutions.v1.yaml](./contracts/admin-solutions.v1.yaml) and [contracts/public-solutions.v1.yaml](./contracts/public-solutions.v1.yaml).
