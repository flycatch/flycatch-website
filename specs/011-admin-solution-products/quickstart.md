# Quickstart: Solution Products

## Prerequisites

Database migrated through revision `016`. Staff user with `solution_products.read` and `solution_products.create`.

## Validate

1. `GET /api/v1/admin/solution-products` — 200, `per_page` 10.
2. `POST` with `{ "product_title": "Analytics", "slug": "analytics" }` — 201, draft.
3. Negative `order` is rejected (422).
4. `PATCH` with `status: publish`.
5. `GET /api/v1/public/solution-products/analytics` — 200, no `status`.

See [contracts/admin-solution-products.v1.yaml](./contracts/admin-solution-products.v1.yaml) and [contracts/public-solution-products.v1.yaml](./contracts/public-solution-products.v1.yaml).
