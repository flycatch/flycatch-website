# Quickstart: News Category

## Prerequisites

Database migrated through revision `025`. Staff user with `News Category` resource grants (administrator has all).

## Validate

1. Sign in and `GET /api/v1/admin/news-categories` — 200, `per_page` 10.
2. `POST` a valid payload — 201, `status` draft.
3. `PATCH` with `status: publish` — published.
4. `GET /api/v1/public/news-categories` without auth — published rows only; omits `status`.

See contracts in this folder.
