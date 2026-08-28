# Feature Specification: Administration Application Development Service and Public Reads

**Feature Branch**: `018-admin-application-development`

**Created**: 2026-08-28

**Status**: Draft

**Input**: Staff Administration CRUD for Application Development Service (banner, intro, application development accordion, offering, FAQ, SEO; list Content Available In En); plus unauthenticated public list and slug detail of published entries.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- List columns: ID, Banner Title, Banner Image, Introduction First Paragraph (truncated), Content Available In, State, Actions
- Slug generated from Banner Title; unique
- SEO via existing ContentSeo shape
- Status `draft` or `publish`; default draft
- RBAC: `application_development.create|read|update|delete|publish`
- Public list and `GET` by slug of published rows only

### Out of scope

- Public writes
- Website frontend pages
- Page Name field

## Requirements

- **FR-001**: Staff with `application_development.read` MUST list and read entries on `/api/v1/admin/application-development`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `application_development.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Nested accordion `order` values MUST be ≥ 0 where accordions exist.
- **FR-005**: Slug MUST be unique (case-insensitive) and valid `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **FR-006**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-007**: `contracts/public-application-development.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **ApplicationDevelopment**: banner, intro, application development accordion, offering, FAQ, SEO; list Content Available In En, slug, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-application-development.v1.yaml](./contracts/admin-application-development.v1.yaml) | Bearer | `/admin/application-development` |
| Public | [contracts/public-application-development.v1.yaml](./contracts/public-application-development.v1.yaml) | None | `/public/application-development` |
