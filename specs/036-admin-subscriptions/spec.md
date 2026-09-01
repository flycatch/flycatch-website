# Feature Specification: Administration Subscriptions and Public Reads

**Feature Branch**: `036-admin-subscriptions`

**Created**: 2026-09-01

**Status**: Draft

**Input**: Staff Administration CRUD for subscription emails; plus unauthenticated public reads of published rows.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Drafts MUST NOT appear on public routes.

## Scope

Staff list, create, edit, delete, search, pagination of ten, and draft/publish on each row. Public GET returns only `publish` rows. Permissions are `subscriptions.create|read|update|delete|publish`.

### Out of scope

- Website frontend pages
- Snapshot publish pipeline
- Public write/delete
- Visitor self-subscribe forms

## User Scenarios & Testing

### User Story 1 - Staff manage subscriptions (Priority: P1)

A signed-in staff member lists, creates, updates, publishes, and deletes subscription records.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/subscriptions`, **Then** the request is rejected
2. **Given** staff with `subscriptions.read`, **When** they list, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** an invalid email, **When** they save, **Then** the email field is rejected
4. **Given** staff with create permission, **When** they create, **Then** the row is draft unless they publish
5. **Given** a published inactive row, **When** the public list is read, **Then** the row appears with `active` false

### User Story 2 - Public published reads (Priority: P1)

Unauthenticated callers list published subscriptions only, identified by UUID.

## Requirements

- **FR-001**: Staff with `subscriptions.read` MUST list and read `/admin/subscriptions`.
- **FR-002**: Create/update/delete/publish follow `subscriptions.*` grants.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be 401 or 403.
- **FR-004**: Status MUST be `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract is the staff boundary.
- **FR-006**: Unauthenticated GET `/public/subscriptions` returns only `publish` rows and omits `status`/`state`.
- **FR-007**: Public contract MUST NOT be generated into the Administration FE client.
- **FR-008**: Admin list pagination is ten per page.
- **FR-009**: Admin list columns are ID, Email, Active, Created At, State, Actions.
- **FR-010**: Create/edit fields: Email, Active (true/false). Active is independent of publish status.

## Key Entities

- **Subscription**: See data-model.md.

## Assumptions

- List ID is a 1-based page ordinal, not the UUID.
- Email is unique among subscription rows.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-subscriptions.v1.yaml](./contracts/admin-subscriptions.v1.yaml) | Bearer | `/admin/subscriptions` |
| Public | [contracts/public-subscriptions.v1.yaml](./contracts/public-subscriptions.v1.yaml) | None | `/public/subscriptions` |
