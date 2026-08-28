# Quickstart: User Centered Design

## Prerequisites

Database migrated through revision `024`. Staff user with `user_centered_design.read` and `user_centered_design.create`.

## Validate

1. `GET /api/v1/admin/user-centered-design` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/user-centered-design/{slug}` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-user-centered-design.v1.yaml](./contracts/admin-user-centered-design.v1.yaml) and [contracts/public-user-centered-design.v1.yaml](./contracts/public-user-centered-design.v1.yaml).
