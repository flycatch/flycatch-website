# Feature Specification: Administration Solution Products and Public Reads

**Feature Branch**: `011-admin-solution-products`

**Created**: 2026-08-24

**Status**: Draft

**Input**: Staff Administration CRUD for Solution Products (title, description, tag, images, layout toggles, slug, order, draft/publish); plus unauthenticated public list and slug detail of published products.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

Independent CMS collection. No foreign keys to Solutions or Solution Details.

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- Product title, description, tag, logo/card/banner images, card/banner image-on-right toggles
- Slug generated from product title; unique
- Order number ≥ 0
- Status `draft` or `publish`; default draft
- RBAC: `solution_products.create|read|update|delete|publish`
- Public list and `GET` by slug of published rows only

### Out of scope

- Public writes
- Relating products to solutions or details
- Website frontend pages

## Requirements

- **FR-001**: Staff with `solution_products.read` MUST list and read products on `/api/v1/admin/solution-products`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `solution_products.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: `order` MUST be ≥ 0. Slug MUST be unique and valid.
- **FR-005**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-006**: `contracts/public-solution-products.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **SolutionProduct**: product_title, product_description, product_tag, image keys, layout booleans, slug, order, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-solution-products.v1.yaml](./contracts/admin-solution-products.v1.yaml) | Bearer | `/admin/solution-products` |
| Public | [contracts/public-solution-products.v1.yaml](./contracts/public-solution-products.v1.yaml) | None | `/public/solution-products` |
