# Quickstart: Client Testimonials

## Prerequisites

Database migrated through revision `011`. Staff user with `records.view` and `drafts.save`.

## Validate

1. Sign in and `GET /api/v1/admin/client-testimonials` — 200, `per_page` 10.
2. `POST` with client name, title, and review — 201, `status` draft, `content_available_in` `["en"]`.
3. `POST` with `order: -1` — 422.
4. `PATCH` with `status: publish` — published. List `content_available_in` is `En`.
5. `GET /api/v1/public/client-testimonials` without auth — published rows only; omits `status`.

See [contracts/admin-client-testimonials.v1.yaml](./contracts/admin-client-testimonials.v1.yaml) and [contracts/public-client-testimonials.v1.yaml](./contracts/public-client-testimonials.v1.yaml).
