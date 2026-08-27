# Feature Specification: Administration Data Analytics & Migration and Public Reads

**Feature Branch**: `014-admin-data-analytics`

**Created**: 2026-08-27

**Status**: Draft

**Input**: Staff Administration CRUD for Data Analytics & Migration (page name, banner, introduction, accordion, offering, FAQ, SEO, draft/publish); plus unauthenticated public list and page-name detail of published entries.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- Page name from a fixed six-value select; at most one row per page name
- Repeatable accordion items (order ≥ 0) and FAQ accordion
- SEO via existing ContentSeo shape
- Status `draft` or `publish`; default draft
- RBAC: `data_analytics.create|read|update|delete|publish`
- Public list and `GET` by page name of published rows only

### Out of scope

- Public writes
- Website frontend pages


## Requirements

- **FR-001**: Staff with `data_analytics.read` MUST list and read entries on `/api/v1/admin/data-analytics`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `data_analytics.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Nested accordion `order` values MUST be ≥ 0.
- **FR-005**: `page_name` MUST be unique within this collection.
- **FR-006**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-007**: `contracts/public-data-analytics.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **DataAnalytic**: page_name, banner, introduction, accordion, offering, FAQ, SEO, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-data-analytics.v1.yaml](./contracts/admin-data-analytics.v1.yaml) | Bearer | `/admin/data-analytics` |
| Public | [contracts/public-data-analytics.v1.yaml](./contracts/public-data-analytics.v1.yaml) | None | `/public/data-analytics` |
