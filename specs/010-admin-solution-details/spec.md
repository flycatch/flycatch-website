# Feature Specification: Administration Solution Details and Public Reads

**Feature Branch**: `010-admin-solution-details`

**Created**: 2026-08-24

**Status**: Draft

**Input**: Staff Administration CRUD for Solution Details (banner, introduction, challenges, benefits, solutions section, title/slug, SEO, draft/publish); plus unauthenticated public list and slug detail of published entries.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

Independent CMS collection. Nested Introduction / Challenges / Benefits / Types / Solutions Section are JSON on the parent row. Industry Type is free text.

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- Repeatable accordion items with order ≥ 0, native color, rich text where specified, image uploads
- Slug generated from Title; unique
- SEO via existing ContentSeo shape
- Status `draft` or `publish`; default draft
- RBAC: `solution_details.create|read|update|delete|publish`
- Public list and `GET` by slug of published rows only

### Out of scope

- Public writes
- Relating to Solutions or Solution Products
- Website frontend pages
- Icon font libraries (icons are image uploads)

## Requirements

- **FR-001**: Staff with `solution_details.read` MUST list and read entries on `/api/v1/admin/solution-details`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `solution_details.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Nested `order` values MUST be ≥ 0.
- **FR-005**: Slug MUST be unique (case-insensitive) and valid `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **FR-006**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-007**: `contracts/public-solution-details.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **SolutionDetail**: title, slug, banner JSON, introduction JSON, challenges JSON, benefits JSON, solutions_section JSON, seo JSON, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-solution-details.v1.yaml](./contracts/admin-solution-details.v1.yaml) | Bearer | `/admin/solution-details` |
| Public | [contracts/public-solution-details.v1.yaml](./contracts/public-solution-details.v1.yaml) | None | `/public/solution-details` |
