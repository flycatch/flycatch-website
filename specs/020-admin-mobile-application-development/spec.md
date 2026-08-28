# Feature Specification: Administration Mobile Application Development and Public Reads

**Feature Branch**: `020-admin-mobile-application-development`

**Created**: 2026-08-28

**Status**: Draft

**Input**: Staff Administration CRUD for Mobile Application Development (banner, intro (three paragraphs), accordion, offering, FAQ, SEO; list truncated SEO); plus unauthenticated public list and slug detail of published entries.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- List columns: ID, Banner Title, Banner Image, SEO (truncated), State, Actions
- Slug generated from Banner Title; unique
- SEO via existing ContentSeo shape
- Status `draft` or `publish`; default draft
- RBAC: `mobile_application_development.create|read|update|delete|publish`
- Public list and `GET` by slug of published rows only

### Out of scope

- Public writes
- Website frontend pages
- Page Name field

## Requirements

- **FR-001**: Staff with `mobile_application_development.read` MUST list and read entries on `/api/v1/admin/mobile-application-development`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `mobile_application_development.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Nested accordion `order` values MUST be ≥ 0 where accordions exist.
- **FR-005**: Slug MUST be unique (case-insensitive) and valid `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **FR-006**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-007**: `contracts/public-mobile-application-development.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **MobileApplicationDevelopment**: banner, intro (three paragraphs), accordion, offering, FAQ, SEO; list truncated SEO, slug, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-mobile-application-development.v1.yaml](./contracts/admin-mobile-application-development.v1.yaml) | Bearer | `/admin/mobile-application-development` |
| Public | [contracts/public-mobile-application-development.v1.yaml](./contracts/public-mobile-application-development.v1.yaml) | None | `/public/mobile-application-development` |
