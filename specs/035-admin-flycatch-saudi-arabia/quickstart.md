# Quickstart: Flycatch Saudi Arabia

## Prerequisites

Database migrated through revision `026`. Staff user with `Flycatch Saudi Arabia` resource grants (administrator has all).

## Validate

1. Sign in and `GET /api/v1/admin/flycatch-saudi-arabia` — 200, `per_page` 10.
2. `POST` a valid payload with two service items — 201, list shows `service_section` 2 and names.
3. `PATCH` with `status: publish` — published.
4. `GET /api/v1/public/flycatch-saudi-arabia` without auth — published rows only; omits `status`.

See contracts in this folder.
