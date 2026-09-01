# Quickstart: Subscriptions

## Prerequisites

Database migrated through revision `026`. Staff user with `Subscription` resource grants (administrator has all).

## Validate

1. Sign in and `GET /api/v1/admin/subscriptions` — 200, `per_page` 10.
2. `POST` a valid payload — 201, `status` draft, `active` false unless set.
3. `PATCH` with `status: publish` — published; public list includes the row even if `active` is false.
4. `GET /api/v1/public/subscriptions` without auth — published rows only; omits `status`.

See contracts in this folder.
