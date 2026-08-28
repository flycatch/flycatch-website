# Feature Specification: Administration DevOps Consult and Public Reads

**Feature Branch**: `016-admin-devops-consult`

**Created**: 2026-08-28

**Status**: Draft

**Input**: Staff Administration CRUD for DevOps Consult (banner, intro, experience (title/accordion/image/description), FAQ, SEO); plus unauthenticated public list and slug detail of published entries.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- List columns: ID, Banner Title, Banner Image, Introduction Title, State, Actions
- Slug generated from Banner Title; unique
- SEO via existing ContentSeo shape
- Status `draft` or `publish`; default draft
- RBAC: `devops_consult.create|read|update|delete|publish`
- Public list and `GET` by slug of published rows only

### Out of scope

- Public writes
- Website frontend pages
- Page Name field

## Requirements

- **FR-001**: Staff with `devops_consult.read` MUST list and read entries on `/api/v1/admin/devops-consult`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `devops_consult.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Nested accordion `order` values MUST be ≥ 0 where accordions exist.
- **FR-005**: Slug MUST be unique (case-insensitive) and valid `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **FR-006**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-007**: `contracts/public-devops-consult.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **DevOpsConsult**: banner, intro, experience (title/accordion/image/description), FAQ, SEO, slug, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-devops-consult.v1.yaml](./contracts/admin-devops-consult.v1.yaml) | Bearer | `/admin/devops-consult` |
| Public | [contracts/public-devops-consult.v1.yaml](./contracts/public-devops-consult.v1.yaml) | None | `/public/devops-consult` |
