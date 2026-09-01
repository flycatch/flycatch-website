# Feature Specification: Administration Flycatch Saudi Arabia and Public Reads

**Feature Branch**: `035-admin-flycatch-saudi-arabia`

**Created**: 2026-09-01

**Status**: Draft

**Input**: Staff Administration CRUD for Flycatch Saudi Arabia page records; plus unauthenticated public reads of published rows.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Drafts MUST NOT appear on public routes.

## Scope

Staff list, create, edit, delete, search, pagination of ten, and draft/publish on each row. Public GET returns only `publish` rows. Permissions are `flycatch_saudi_arabia.create|read|update|delete|publish`.

Multiple rows are allowed (not a singleton page).

### Out of scope

- Website frontend pages
- Snapshot publish pipeline
- Public write/delete/media upload

## User Scenarios & Testing

### User Story 1 - Staff manage Flycatch Saudi Arabia records (Priority: P1)

A signed-in staff member lists, creates, updates, publishes, and deletes records with a repeatable service section, optional video, and SEO.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/flycatch-saudi-arabia`, **Then** the request is rejected
2. **Given** staff with `flycatch_saudi_arabia.read`, **When** they list, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** a row with two service items, **When** staff view the list, **Then** Service Section shows “2 items”; opening the control shows item titles in a popover without shifting the table
4. **Given** a row with an uploaded video, **When** staff view the list, **Then** Video File shows the file format
5. **Given** staff with create permission, **When** they create, **Then** the row is draft unless they publish

### User Story 2 - Public published reads (Priority: P1)

Unauthenticated callers list published records only, identified by UUID.

## Requirements

- **FR-001**: Staff with `flycatch_saudi_arabia.read` MUST list and read `/admin/flycatch-saudi-arabia`.
- **FR-002**: Create/update/delete/publish follow `flycatch_saudi_arabia.*` grants.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be 401 or 403.
- **FR-004**: Status MUST be `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract is the staff boundary.
- **FR-006**: Unauthenticated GET `/public/flycatch-saudi-arabia` returns only `publish` rows and omits `status`/`state`.
- **FR-007**: Public contract MUST NOT be generated into the Administration FE client.
- **FR-008**: Admin list pagination is ten per page.
- **FR-009**: Admin list columns are ID, Banner Title, Service Section (item count + popover of names), Video File (format), State, Actions.
- **FR-010**: Create/edit: Banner Title; Service Section (repeatable: image, types title, contents, links); Banner Explore Text; Services Title; Video File; SEO (existing SEO fields).

## Key Entities

- **FlycatchSaudiArabia**: See data-model.md.

## Assumptions

- List ID is a 1-based page ordinal, not the UUID.
- Service item names in the popover use each item’s types title.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-flycatch-saudi-arabia.v1.yaml](./contracts/admin-flycatch-saudi-arabia.v1.yaml) | Bearer | `/admin/flycatch-saudi-arabia` |
| Public | [contracts/public-flycatch-saudi-arabia.v1.yaml](./contracts/public-flycatch-saudi-arabia.v1.yaml) | None | `/public/flycatch-saudi-arabia` |
