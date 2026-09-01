# Feature Specification: Administration Memberships and Public Reads

**Feature Branch**: `032-admin-memberships`

**Created**: 2026-08-31

**Status**: Draft

**Input**: Staff Administration CRUD for memberships; plus unauthenticated public reads of published rows.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Drafts MUST NOT appear on public routes.

## Scope

Staff list, create, edit, delete, search, pagination of ten, and draft/publish on each row. Public GET returns only `publish` rows. Permissions are `memberships.create|read|update|delete|publish`.

### Out of scope

- Website frontend pages
- Snapshot publish pipeline
- Public write/delete/media upload

## User Scenarios & Testing

### User Story 1 - Staff manage memberships (Priority: P1)

A signed-in staff member lists, creates, updates, publishes, and deletes memberships records.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/memberships`, **Then** the request is rejected
2. **Given** staff with `memberships.read`, **When** they list, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with create permission, **When** they create, **Then** the row is draft unless they publish

### User Story 2 - Public published reads (Priority: P1)

Unauthenticated callers list published memberships only.

## Requirements

- **FR-001**: Staff with `memberships.read` MUST list and read `/admin/memberships`.
- **FR-002**: Create/update/delete/publish follow `memberships.*` grants.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be 401 or 403.
- **FR-004**: Status MUST be `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract is the staff boundary.
- **FR-006**: Unauthenticated GET `/public/memberships` returns only `publish` rows and omits `status`/`state`.
- **FR-007**: Public contract MUST NOT be generated into the Administration FE client.
- **FR-008**: Admin list pagination is ten per page.
- **FR-009**: Images are a repeatable list of image keys. SEO reused. List shows SEO title.


## Key Entities

- **Memberships**: See data-model.md.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-memberships.v1.yaml](./contracts/admin-memberships.v1.yaml) | Bearer | `/admin/memberships` |
| Public | [contracts/public-memberships.v1.yaml](./contracts/public-memberships.v1.yaml) | None | `/public/memberships` |
