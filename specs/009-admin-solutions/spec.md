# Feature Specification: Administration Solutions and Public Reads

**Feature Branch**: `009-admin-solutions`

**Created**: 2026-08-24

**Status**: Draft

**Input**: Staff Administration CRUD for Solutions (banner image, banner title, section title, SEO, draft/publish); plus unauthenticated public list of published solutions.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

Independent CMS collection. No foreign keys to Solution Details or Solution Products.

Row `draft` / `publish` is stored on each solution. It does **not** use the site-settings/page publish snapshot pipeline.

### In scope

- Administration list, create, edit, and delete of solutions
- Search and pagination of ten on the admin list
- Banner image upload (existing `/admin/media`), banner title, section title, reusable SEO fields
- Status `draft` or `publish`; new entries default to draft
- RBAC: `solutions.create|read|update|delete|publish`
- Public, unauthenticated `GET` list of published solutions
- Separate admin and public contracts, schemas, and routes

### Out of scope

- Public write, update, delete, or publish actions
- Public UUID detail (this type has no slug)
- Relating solutions to solution details or products
- Website frontend pages

## User Scenarios & Testing

### User Story 1 - Staff manage solutions (Priority: P1)

A signed-in staff member lists solutions (search, ten per page) and creates or updates banner image, banner title, section title, SEO, and publish state. New entries start as draft. Publish sets state to published; Unpublish returns the row to draft.

### User Story 2 - Public published solutions (Priority: P1)

Unauthenticated callers list published solutions. Drafts are absent. Payloads omit staff `id` and `status`.

## Requirements

- **FR-001**: Staff with `solutions.read` MUST list and read solutions on `/api/v1/admin/solutions`.
- **FR-002**: Staff with `solutions.create|update|delete` MUST create, update, and delete solutions. Setting `status` to `publish` also requires `solutions.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Status MUST be stored as `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract `contracts/admin-solutions.v1.yaml` is the staff boundary.
- **FR-006**: Unauthenticated `GET /api/v1/public/solutions` returns only `publish` solutions.
- **FR-007**: Public list uses separate schemas and routes. Public payloads omit `id`, `state`, and `status`.
- **FR-008**: `contracts/public-solutions.v1.yaml` MUST NOT be generated into the Administration FE client.
- **FR-009**: Admin list search matches banner title and section title. Pagination is ten per page.

## Key Entities

- **Solution**: Banner image key, banner title, section title, SEO JSON, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-solutions.v1.yaml](./contracts/admin-solutions.v1.yaml) | Bearer | `/admin/solutions` |
| Public | [contracts/public-solutions.v1.yaml](./contracts/public-solutions.v1.yaml) | None | `GET /public/solutions` |
