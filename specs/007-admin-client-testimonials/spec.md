# Feature Specification: Administration Client Testimonials and Public Reads

**Feature Branch**: `007-admin-client-testimonials`

**Created**: 2026-08-20

**Status**: Draft

**Input**: Staff Administration CRUD for client testimonials; plus unauthenticated public list of published testimonials.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I) is a non-regression: drafts MUST NOT appear on public routes.

## Scope

This feature **adds** staff management of client testimonials on the Administration UI, and **adds** a separate public read API for published testimonials.

Row `draft` / `publish` is stored on each testimonial. It does **not** use the site-settings/page publish snapshot pipeline.

### In scope

- Administration list, create, edit, and delete of client testimonials
- Search and pagination of ten on the admin list
- Testimonial status `draft` or `publish`
- Public, unauthenticated `GET` list of published testimonials
- Separate admin and public contracts, schemas, and routes

### Out of scope

- Public write, update, delete, or publish actions
- Public counterparts for auth, RBAC, snapshot publish, or media upload
- Website frontend testimonial pages
- New RBAC permission names
- Client logos (separate feature `006-admin-client-logos`)

## User Scenarios & Testing

### User Story 1 - Staff manage client testimonials (Priority: P1)

A signed-in staff member lists testimonials (search, ten per page) and creates or updates client name, title, review, designation, company, country, image, alt text, Clutch flag, order, review link, and publish state. New entries start as draft. Content Available In shows English (En). Order must not be negative.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/client-testimonials`, **Then** the request is rejected
2. **Given** staff with view permission, **When** they list testimonials, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with draft-save permission, **When** they create a testimonial, **Then** the stored row is draft unless they publish
4. **Given** a negative order, **When** they save, **Then** the request is rejected

### User Story 2 - Public published testimonials (Priority: P1)

Unauthenticated callers list published testimonials ordered by display order. Drafts are absent.

## Requirements

- **FR-001**: Staff with records.view MUST list and read testimonials on `/api/v1/admin/client-testimonials`.
- **FR-002**: Staff with drafts.save MUST create, update, and delete testimonials on `/api/v1/admin/client-testimonials`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Status MUST be stored as `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract `contracts/admin-client-testimonials.v1.yaml` is the staff boundary.
- **FR-006**: Unauthenticated `GET /api/v1/public/client-testimonials` returns only `publish` testimonials.
- **FR-007**: Public list uses separate schemas and routes from admin. Public payloads omit `state`, `status`, and UUIDs.
- **FR-008**: `contracts/public-client-testimonials.v1.yaml` MUST NOT be generated into the Administration FE client.
- **FR-009**: Admin list search matches client name, title, and review. Pagination is ten per page.
- **FR-010**: Client name, title, and review are required. Order MUST be an integer greater than or equal to zero.
- **FR-011**: Content available in is English (`en`) by default and is not staff-editable in this release.

## Key Entities

- **ClientTestimonial**: Client name, title, review, designation, company, country, image, alt text, Clutch flag, order, review link, locales, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-client-testimonials.v1.yaml](./contracts/admin-client-testimonials.v1.yaml) | Bearer | `/admin/client-testimonials` |
| Public | [contracts/public-client-testimonials.v1.yaml](./contracts/public-client-testimonials.v1.yaml) | None | `GET /public/client-testimonials` |
