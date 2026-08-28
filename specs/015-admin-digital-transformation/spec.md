# Feature Specification: Administration Digital Transformation and Public Reads

**Feature Branch**: `015-admin-digital-transformation`

**Created**: 2026-08-27

**Status**: Draft

**Input**: Staff Administration CRUD for Digital Transformation pages (banner including tag line, introduction, accordion, outcomes, FAQ, SEO, draft/publish); plus unauthenticated public list and slug detail of published entries. No Page Name field.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- Repeatable digital transformation accordion and FAQ accordion
- Slug generated from Banner Title; unique
- SEO via existing ContentSeo shape
- Status `draft` or `publish`; default draft
- RBAC: `digital_transformation.create|read|update|delete|publish`
- Public list and `GET` by slug of published rows only

### Out of scope

- Public writes
- Website frontend pages
- Page Name field

## Requirements

- **FR-001**: Staff with `digital_transformation.read` MUST list and read entries on `/api/v1/admin/digital-transformation`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `digital_transformation.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Nested accordion `order` values MUST be ≥ 0.
- **FR-005**: Slug MUST be unique (case-insensitive) and valid `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **FR-006**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-007**: `contracts/public-digital-transformation.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **DigitalTransformation**: banner title/image/tag line, introduction, accordion, outcomes, FAQ, SEO, slug, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-digital-transformation.v1.yaml](./contracts/admin-digital-transformation.v1.yaml) | Bearer | `/admin/digital-transformation` |
| Public | [contracts/public-digital-transformation.v1.yaml](./contracts/public-digital-transformation.v1.yaml) | None | `/public/digital-transformation` |
