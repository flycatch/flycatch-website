# Feature Specification: Administration AI Services and Public Reads

**Feature Branch**: `012-admin-ai-services`

**Created**: 2026-08-27

**Status**: Draft

**Input**: Staff Administration CRUD for AI Services pages (banner, introduction, solutions copy, industry section, AI expertise, related Solutions, FAQ, SEO, draft/publish); plus unauthenticated public list and slug detail of published entries with nested published Solutions.

**Constitution alignment**: Contract-first (III), security (VIII), i18n (V), quality gates (XIII). Public SEO (I): drafts MUST NOT appear on public routes.

## Scope

### In scope

- Administration list, create, edit, and delete
- Search and pagination of ten
- Repeatable industry items and AI expertise accordion
- Multi-select of existing Solutions; public detail hydrates published Solutions in selection order
- Slug generated from Banner Title; unique
- SEO via existing ContentSeo shape
- Status `draft` or `publish`; default draft
- RBAC: `ai_services.create|read|update|delete|publish`
- Public list and `GET` by slug of published rows only

### Out of scope

- Public writes
- Website frontend pages
- FAQ accordion (FAQ title and description only)

## Requirements

- **FR-001**: Staff with `ai_services.read` MUST list and read entries on `/api/v1/admin/ai-services`.
- **FR-002**: Create/update/delete require matching write actions; publish status requires `ai_services.publish`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403).
- **FR-004**: Nested accordion `order` values MUST be ≥ 0.
- **FR-005**: Slug MUST be unique (case-insensitive) and valid `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **FR-006**: Unauthenticated public routes return only `publish` rows and omit staff `id`/`status`.
- **FR-007**: Public detail MUST include complete published Solution records for selected `solution_ids`.
- **FR-008**: `contracts/public-ai-services.v1.yaml` MUST NOT be generated into the Administration FE client.

## Key Entities

- **AiService**: banner, introduction, solutions copy, industry section, AI expertise, solution_ids, FAQ, SEO, slug, status.

## Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-ai-services.v1.yaml](./contracts/admin-ai-services.v1.yaml) | Bearer | `/admin/ai-services` |
| Public | [contracts/public-ai-services.v1.yaml](./contracts/public-ai-services.v1.yaml) | None | `/public/ai-services` |
