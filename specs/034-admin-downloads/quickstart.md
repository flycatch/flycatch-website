# Quickstart: Downloads

## Prerequisites

Database migrated through revision `026`. Staff user with `Download` resource grants (administrator has all).

## Validate

1. Sign in and `GET /api/v1/admin/downloads` — 200, `per_page` 10.
2. `POST` without `file_key` — 422.
3. `POST` a valid payload with PDF key — 201, `status` draft.
4. `GET /api/v1/public/downloads` without auth — published rows only; omits `status`.

See contracts in this folder.
