# Feature Specification: Administration Contacts and Public Reads

**Feature Branch**: `033-admin-contacts`

**Created**: 2026-09-01

**Status**: Draft

**Input**: Staff Administration CRUD for contact entries; plus unauthenticated public reads of published rows.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Drafts MUST NOT appear on public routes.

## Scope

Staff list, create, edit, delete, search, pagination of ten, and draft/publish on each row. Public GET returns only `publish` rows. Permissions are `contacts.create|read|update|delete|publish`.

### Out of scope

- Website frontend pages
- Snapshot publish pipeline
- Public write/delete/media upload
- Geographic “state/province” field (list **State** is draft/publish)

## User Scenarios & Testing

### User Story 1 - Staff manage contacts (Priority: P1)

A signed-in staff member lists, creates, updates, publishes, and deletes contact records.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/contacts`, **Then** the request is rejected
2. **Given** staff with `contacts.read`, **When** they list, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with create permission, **When** they create, **Then** the row is draft unless they publish
4. **Given** an invalid email, **When** they save, **Then** the email field is rejected

### User Story 2 - Public published reads (Priority: P1)

Unauthenticated callers list published contacts only, identified by UUID.

## Requirements

- **FR-001**: Staff with `contacts.read` MUST list and read `/admin/contacts`.
- **FR-002**: Create/update/delete/publish follow `contacts.*` grants.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be 401 or 403.
- **FR-004**: Status MUST be `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract is the staff boundary.
- **FR-006**: Unauthenticated GET `/public/contacts` returns only `publish` rows and omits `status`/`state`.
- **FR-007**: Public contract MUST NOT be generated into the Administration FE client.
- **FR-008**: Admin list pagination is ten per page.
- **FR-009**: Admin list columns are ID (page ordinal), Name, Email, Country, State (draft/publish), Actions.
- **FR-010**: Create/edit fields: Name, Last Name, Email, Country, Phone No, Subject, Date, Details, Contact Type (free text), Company Name.

## Key Entities

- **Contact**: See data-model.md.

## Assumptions

- List ID is a 1-based page ordinal, not the UUID.
- Contact Type is free text.
- Date is an optional calendar date (`contact_date`).

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-contacts.v1.yaml](./contracts/admin-contacts.v1.yaml) | Bearer | `/admin/contacts` |
| Public | [contracts/public-contacts.v1.yaml](./contracts/public-contacts.v1.yaml) | None | `/public/contacts` |
