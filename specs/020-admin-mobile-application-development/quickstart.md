# Quickstart: Mobile Application Development

## Prerequisites

Database migrated through revision `024`. Staff user with `mobile_application_development.read` and `mobile_application_development.create`.

## Validate

1. `GET /api/v1/admin/mobile-application-development` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/mobile-application-development/{slug}` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-mobile-application-development.v1.yaml](./contracts/admin-mobile-application-development.v1.yaml) and [contracts/public-mobile-application-development.v1.yaml](./contracts/public-mobile-application-development.v1.yaml).
