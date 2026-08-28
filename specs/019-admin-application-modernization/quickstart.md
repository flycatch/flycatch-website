# Quickstart: Application Modernization

## Prerequisites

Database migrated through revision `024`. Staff user with `application_modernization.read` and `application_modernization.create`.

## Validate

1. `GET /api/v1/admin/application-modernization` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/application-modernization/{slug}` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-application-modernization.v1.yaml](./contracts/admin-application-modernization.v1.yaml) and [contracts/public-application-modernization.v1.yaml](./contracts/public-application-modernization.v1.yaml).
