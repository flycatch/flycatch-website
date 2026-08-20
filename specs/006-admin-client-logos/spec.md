# Feature Specification: Administration Client Logos and Public Reads

**Feature Branch**: `006-admin-client-logos`

**Created**: 2026-08-20

**Status**: Draft

**Input**: Staff Administration CRUD for client logos (colour and white variants, alt text, draft/publish); plus unauthenticated public list of published logos.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I) is a non-regression: drafts MUST NOT appear on public routes.

## Scope

This feature **adds** staff management of client logos on the Administration UI, and **adds** a separate public read API for published logos.

Row `draft` / `publish` is stored on each logo. It does **not** use the site-settings/page publish snapshot pipeline.

### In scope

- Administration list, create, edit, and delete of client logos
- Search and pagination of ten on the admin list
- Logo status `draft` or `publish`
- Public, unauthenticated `GET` list of published logos
- Separate admin and public contracts, schemas, and routes

### Out of scope

- Public write, update, delete, or publish actions
- Public counterparts for auth, RBAC, snapshot publish, or media upload
- Website frontend logo galleries
- New RBAC permission names
- Client testimonials (separate feature `007-admin-client-testimonials`)

## User Scenarios & Testing

### User Story 1 - Staff manage client logos (Priority: P1)

A signed-in staff member lists logos (search, ten per page) and creates or updates colour logo, white logo, alt text, and publish state. New entries start as draft. Publish sets state to published; Unpublish returns the row to draft.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/client-logos`, **Then** the request is rejected
2. **Given** staff with view permission, **When** they list logos, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with draft-save permission, **When** they create a logo, **Then** the stored row is draft unless they publish
4. **Given** a draft logo, **When** staff publish, **Then** state is published; **When** they unpublish, **Then** state is draft

### User Story 2 - Public published logos (Priority: P1)

Unauthenticated callers list published logos. Drafts are absent from the list.

## Requirements

- **FR-001**: Staff with records.view MUST list and read client logos on `/api/v1/admin/client-logos`.
- **FR-002**: Staff with drafts.save MUST create, update, and delete logos on `/api/v1/admin/client-logos`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Status MUST be stored as `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract `contracts/admin-client-logos.v1.yaml` is the staff boundary.
- **FR-006**: Unauthenticated `GET /api/v1/public/client-logos` returns only `publish` logos.
- **FR-007**: Public list uses separate schemas and routes from admin. Public payloads omit `state`, `status`, and UUIDs.
- **FR-008**: `contracts/public-client-logos.v1.yaml` MUST NOT be generated into the Administration FE client.
- **FR-009**: Admin list search matches alt text. Pagination is ten per page.
- **FR-010**: Alt text is required. Colour and white logo media keys are optional.

## Key Entities

- **ClientLogo**: Colour logo media key, white logo media key, alt text, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-client-logos.v1.yaml](./contracts/admin-client-logos.v1.yaml) | Bearer | `/admin/client-logos` |
| Public | [contracts/public-client-logos.v1.yaml](./contracts/public-client-logos.v1.yaml) | None | `GET /public/client-logos` |
