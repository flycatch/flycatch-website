# Quickstart: Employee Testimonials

## Prerequisites

Database migrated through revision `025`. Staff user with `Employee Testimonials` resource grants (administrator has all).

## Validate

1. Sign in and `GET /api/v1/admin/employee-testimonials` — 200, `per_page` 10.
2. `POST` a valid payload — 201, `status` draft.
3. `PATCH` with `status: publish` — published.
4. `GET /api/v1/public/employee-testimonials` without auth — published rows only; omits `status`.

See contracts in this folder.
