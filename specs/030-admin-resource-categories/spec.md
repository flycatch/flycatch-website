# Feature Specification: Administration Resources Category and Public Reads

**Feature Branch**: `030-admin-resource-categories`

**Created**: 2026-08-31

**Status**: Draft

**Input**: Staff Administration CRUD for resources category; plus unauthenticated public reads of published rows.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Drafts MUST NOT appear on public routes.

## Scope

Staff list, create, edit, delete, search, pagination of ten, and draft/publish on each row. Public GET returns only `publish` rows. Permissions are `resource_categories.create|read|update|delete|publish`.

### Out of scope

- Website frontend pages
- Snapshot publish pipeline
- Public write/delete/media upload

## User Scenarios & Testing

### User Story 1 - Staff manage resources category (Priority: P1)

A signed-in staff member lists, creates, updates, publishes, and deletes resources category records.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/resource-categories`, **Then** the request is rejected
2. **Given** staff with `resource_categories.read`, **When** they list, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with create permission, **When** they create, **Then** the row is draft unless they publish

### User Story 2 - Public published reads (Priority: P1)

Unauthenticated callers list published resources category only.

## Requirements

- **FR-001**: Staff with `resource_categories.read` MUST list and read `/admin/resource-categories`.
- **FR-002**: Create/update/delete/publish follow `resource_categories.*` grants.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be 401 or 403.
- **FR-004**: Status MUST be `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract is the staff boundary.
- **FR-006**: Unauthenticated GET `/public/resource-categories` returns only `publish` rows and omits `status`/`state`.
- **FR-007**: Public contract MUST NOT be generated into the Administration FE client.
- **FR-008**: Admin list pagination is ten per page.


## Key Entities

- **ResourcesCategory**: See data-model.md.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-resource-categories.v1.yaml](./contracts/admin-resource-categories.v1.yaml) | Bearer | `/admin/resource-categories` |
| Public | [contracts/public-resource-categories.v1.yaml](./contracts/public-resource-categories.v1.yaml) | None | `/public/resource-categories` |
