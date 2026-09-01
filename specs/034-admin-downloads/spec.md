# Feature Specification: Administration Downloads and Public Reads

**Feature Branch**: `034-admin-downloads`

**Created**: 2026-09-01

**Status**: Draft

**Input**: Staff Administration CRUD for downloadable PDF entries; plus unauthenticated public reads of published rows.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Drafts MUST NOT appear on public routes.

## Scope

Staff list, create, edit, delete, search, pagination of ten, and draft/publish on each row. Public GET returns only `publish` rows. Permissions are `downloads.create|read|update|delete|publish`.

### Out of scope

- Website frontend pages
- Snapshot publish pipeline
- Public write/delete/media upload

## User Scenarios & Testing

### User Story 1 - Staff manage downloads (Priority: P1)

A signed-in staff member lists, creates, updates, publishes, and deletes download records with a required PDF file.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/downloads`, **Then** the request is rejected
2. **Given** staff with `downloads.read`, **When** they list, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with create permission, **When** they create without a PDF, **Then** the save is rejected
4. **Given** staff with create permission and a PDF, **When** they create, **Then** the row is draft unless they publish

### User Story 2 - Public published reads (Priority: P1)

Unauthenticated callers list published downloads only, identified by UUID.

## Requirements

- **FR-001**: Staff with `downloads.read` MUST list and read `/admin/downloads`.
- **FR-002**: Create/update/delete/publish follow `downloads.*` grants.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be 401 or 403.
- **FR-004**: Status MUST be `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract is the staff boundary.
- **FR-006**: Unauthenticated GET `/public/downloads` returns only `publish` rows and omits `status`/`state`.
- **FR-007**: Public contract MUST NOT be generated into the Administration FE client.
- **FR-008**: Admin list pagination is ten per page.
- **FR-009**: Admin list columns are ID (page ordinal), Name, State, Actions.
- **FR-010**: Create/edit fields: Name, Company, File (mandatory PDF).

## Key Entities

- **Download**: See data-model.md.

## Assumptions

- List ID is a 1-based page ordinal, not the UUID.
- File is stored as an object-storage media key for a PDF.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-downloads.v1.yaml](./contracts/admin-downloads.v1.yaml) | Bearer | `/admin/downloads` |
| Public | [contracts/public-downloads.v1.yaml](./contracts/public-downloads.v1.yaml) | None | `/public/downloads` |
