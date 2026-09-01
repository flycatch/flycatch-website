# Feature Specification: Administration Email Templates and Public Reads

**Feature Branch**: `027-admin-email-templates`

**Created**: 2026-08-31

**Status**: Draft

**Input**: Staff Administration CRUD for email templates; plus unauthenticated public reads of published rows.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Drafts MUST NOT appear on public routes.

## Scope

Staff list, create, edit, delete, search, pagination of ten, and draft/publish on each row. Public GET returns only `publish` rows. Permissions are `email_templates.create|read|update|delete|publish`.

### Out of scope

- Website frontend pages
- Snapshot publish pipeline
- Public write/delete/media upload

## User Scenarios & Testing

### User Story 1 - Staff manage email templates (Priority: P1)

A signed-in staff member lists, creates, updates, publishes, and deletes email templates records.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/email-templates`, **Then** the request is rejected
2. **Given** staff with `email_templates.read`, **When** they list, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with create permission, **When** they create, **Then** the row is draft unless they publish

### User Story 2 - Public published reads (Priority: P1)

Unauthenticated callers list published email templates only.

## Requirements

- **FR-001**: Staff with `email_templates.read` MUST list and read `/admin/email-templates`.
- **FR-002**: Create/update/delete/publish follow `email_templates.*` grants.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be 401 or 403.
- **FR-004**: Status MUST be `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract is the staff boundary.
- **FR-006**: Unauthenticated GET `/public/email-templates` returns only `publish` rows and omits `status`/`state`.
- **FR-007**: Public contract MUST NOT be generated into the Administration FE client.
- **FR-008**: Admin list pagination is ten per page.
- **FR-009**: Type is `user_notification` or `admin_notification`. Slug is unique.


## Key Entities

- **EmailTemplates**: See data-model.md.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-email-templates.v1.yaml](./contracts/admin-email-templates.v1.yaml) | Bearer | `/admin/email-templates` |
| Public | [contracts/public-email-templates.v1.yaml](./contracts/public-email-templates.v1.yaml) | None | `/public/email-templates` |
