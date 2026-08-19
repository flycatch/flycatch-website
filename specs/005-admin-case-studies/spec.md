# Feature Specification: Administration Case Studies and Public Reads

**Feature Branch**: `005-admin-case-studies`

**Created**: 2026-08-19

**Status**: Draft

**Input**: Staff Administration CRUD for case studies, industries, and case study categories; plus unauthenticated public read endpoints for published case studies.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I) is a non-regression: drafts MUST NOT appear on public routes.

## Scope

This feature **adds** staff management of case studies (with industries and case study categories) on the Administration UI, and **adds** a separate public read API for published case studies.

Row `draft` / `publish` is stored on each entity. It does **not** use the site-settings/page publish snapshot pipeline.

### In scope

- Administration list, create, edit, and delete of case studies, industries, and case study categories
- Search and pagination of ten on every admin list
- Case study, industry, and category status `draft` or `publish`
- Many-to-many industries and case study categories on a case study
- Public, unauthenticated `GET` list of published case studies
- Public, unauthenticated `GET` of one published case study by slug
- Separate admin and public contracts, schemas, and routes

### Out of scope

- Public write, update, delete, or publish actions
- Public industry or category collection endpoints (nested on public case study list/detail is enough)
- Public counterparts for auth, RBAC, snapshot publish, or media upload
- Website frontend case study pages
- New RBAC permission names

## User Scenarios & Testing

### User Story 1 - Staff manage case studies (Priority: P1)

A signed-in staff member lists case studies (search, ten per page) and creates or updates heading, slug, short heading, description, order, industries, categories, image, body, date, and publish state.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/case-studies`, **Then** the request is rejected
2. **Given** staff with view permission, **When** they list case studies, **Then** they see drafts and published rows with search and pagination of ten
3. **Given** staff with draft-save permission, **When** they create or update a case study, **Then** the stored row matches the submitted fields including status

### User Story 2 - Staff manage industries and categories (Priority: P1)

Staff create industries and case study categories by name. Default state is draft. Publish sets state to published. Created rows appear in the case study multi-selects. Category list shows how many case studies use each category.

### User Story 3 - Public published case studies (Priority: P1)

Unauthenticated callers list and fetch published case studies by slug. Drafts are absent from the list; draft slugs return the same 404 as unknown slugs.

## Requirements

- **FR-001**: Staff with records.view MUST list and read case studies, industries, and case study categories on `/api/v1/admin/...`.
- **FR-002**: Staff with drafts.save MUST create, update, and delete those entities on `/api/v1/admin/...`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Status MUST be stored on each row as `draft` or `publish` and MUST NOT write the snapshot pipeline.
- **FR-005**: Versioned admin contract `contracts/admin-case-studies.v1.yaml` is the staff boundary.
- **FR-006**: Unauthenticated `GET /api/v1/public/case-studies` returns only `publish` case studies (`q`, `page`, `per_page` max 10).
- **FR-007**: Unauthenticated `GET /api/v1/public/case-studies/{slug}` returns one published case study. Draft or unknown slugs return 404 `public.case_studies.not_found`.
- **FR-008**: Public list and detail use separate schemas and routes from admin. Public detail is identified by slug.
- **FR-009**: Public nested industries and categories include only published related names. Public payloads omit `state`, `status`, UUIDs, and relation IDs.
- **FR-010**: `contracts/public-case-studies.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **CaseStudy**: Heading, unique slug, short heading, description, order, date, body, image, status, industries, categories.
- **Industry**: Named grouping with status, many-to-many with case studies.
- **CaseStudyCategory**: Named grouping with status and related case study count.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-case-studies.v1.yaml](./contracts/admin-case-studies.v1.yaml) | Bearer | `/admin/case-studies`, `/admin/industries`, `/admin/case-study-categories` |
| Public | [contracts/public-case-studies.v1.yaml](./contracts/public-case-studies.v1.yaml) | None | `GET /public/case-studies`, `GET /public/case-studies/{slug}` |
