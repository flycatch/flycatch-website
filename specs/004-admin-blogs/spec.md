# Feature Specification: Administration Blogs and Public Blog Reads

**Feature Branch**: `004-admin-blogs`

**Created**: 2026-08-19

**Status**: Draft

**Input**: Staff Administration CRUD for blogs, authors, categories, and media; plus unauthenticated public read endpoints so the website frontend can fetch published blog list and detail.

**Constitution alignment**: This specification implements mandatory governance from `.specify/memory/constitution.md` (v1.0.0). Requirements trace primarily to principles III (contract-first), VIII (security), V (i18n), and XIII (quality gates). Public SEO/AEO (I) and Core Web Vitals (VII) apply as a non-regression: this feature MUST NOT expose drafts or Administration URLs as public content.

## Scope

This feature **adds** staff management of blogs (with authors, categories, and media) on the Administration UI, and **adds** a separate public read API for published blogs consumed by the website frontend.

Blog `draft` / `publish` is stored on the blog row. It does **not** use the site-settings/page publish snapshot pipeline (`002-auth-rbac` / `001-website-foundation`).

### In scope

- Administration list, create, edit, and delete of blogs, authors, and categories
- Administration media upload and staff fetch
- Blog status `draft` or `publish` on the blog row
- Many-to-many authors and categories on a blog
- Public, unauthenticated `GET` list of published blogs
- Public, unauthenticated `GET` of one published blog by slug
- Separate admin and public contracts, schemas, and routes

### Out of scope

- Public write, update, delete, or publish actions
- Public counterparts for auth, RBAC, roles, snapshot publish, or media upload
- Public media GET (hero and body still store media keys; a later contract MAY add `/public/media/{key}`)
- Public authors or categories collection endpoints (nested on public blog list/detail is enough)
- Website frontend blog pages or adding blogs to the published snapshot export
- Changing static delivery of existing public pages

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Staff manage blogs in Administration (Priority: P1)

A signed-in staff member with view permission lists blogs (search, ten per page). A staff member with draft-save permission creates or updates a blog, including authors, categories, body, and optional media, and sets status to draft or publish. Delete removes a blog that is not required elsewhere.

**Why this priority**: Without persisted staff CRUD, there is no blog data for the public API to expose.

**Independent Test**: Sign in; create a draft and a published blog; confirm the admin list shows both; confirm unauthenticated `/admin/blogs` is refused.

**Acceptance Scenarios**:

1. **Given** an unauthenticated caller, **When** they request `/admin/blogs`, **Then** the request is rejected as unauthenticated and no blog data is returned
2. **Given** a signed-in staff member with view permission, **When** they list blogs, **Then** they see drafts and published posts with search and pagination of ten
3. **Given** a signed-in staff member with draft-save permission, **When** they create or update a blog, **Then** the stored row matches the submitted fields including status
4. **Given** a published and a draft blog, **When** staff list blogs, **Then** both appear on the administration list

---

### User Story 2 - Website frontend lists published blogs (Priority: P1)

The website frontend (or any unauthenticated caller) requests the public blog list. Only blogs with status `publish` are returned. List items include fields useful for a listing page: title, slug, description, reading time, hero image key and alt, authors (name, designation, image keys), and categories. Admin-only fields such as `state` are omitted.

**Why this priority**: This is the public counterpart required so the website can fetch blog cards without a staff session.

**Independent Test**: Create one draft and one published blog via admin; `GET /public/blogs` without auth; confirm only the published slug appears.

**Acceptance Scenarios**:

1. **Given** no staff session, **When** a caller requests `GET /api/v1/public/blogs`, **Then** the response is 200 and contains only published blogs
2. **Given** a draft blog, **When** the public list is requested, **Then** that blog is absent
3. **Given** a search query, **When** the public list is requested, **Then** results include only matching **published** blogs
4. **Given** a public list item, **When** the payload is inspected, **Then** it has no `state` or `status` field

---

### User Story 3 - Website frontend loads one published blog by slug (Priority: P1)

The website frontend requests one blog by its public slug. A published blog returns visitor-facing detail (title, slug, description, body, reading time, hero image, social and canonical URLs, locales, nested authors and categories). A missing slug or a draft slug returns the same not-found error.

**Why this priority**: Detail pages need a stable public identifier (slug), not a staff UUID.

**Independent Test**: `GET /public/blogs/{published-slug}` returns 200 without auth; `GET /public/blogs/{draft-slug}` returns 404 with `public.blogs.not_found`.

**Acceptance Scenarios**:

1. **Given** a published blog with slug `first-post`, **When** an unauthenticated caller requests `GET /api/v1/public/blogs/first-post`, **Then** the response is 200 with public detail fields and no `status`, `author_ids`, or `category_ids`
2. **Given** a draft with slug `hidden-draft`, **When** an unauthenticated caller requests that slug on the public API, **Then** the response is 404 with `code` `not_found` and `message_key` `public.blogs.not_found`
3. **Given** an unknown slug, **When** the public detail is requested, **Then** the response is the same 404 as a draft (no existence leak of drafts)

---

### Edge Cases

- Public list with no published blogs — empty `items`, `total` 0; paging does not invent rows
- Slug comparison is case-insensitive; a published slug remains unique among all blogs (including drafts)
- Direct requests to Administration addresses MUST remain non-indexable and MUST NOT leak draft bodies in public HTML
- Public API MUST NOT accept POST, PATCH, or DELETE on `/public/blogs`

## Requirements *(mandatory)*

### Functional Requirements

#### Administration (staff)

- **FR-001**: Staff with records.view MUST be able to list and read blogs, authors, and categories on `/api/v1/admin/...`.
- **FR-002**: Staff with drafts.save MUST be able to create, update, and delete blogs, authors, and categories, and upload media, on `/api/v1/admin/...`.
- **FR-003**: Unauthenticated or under-privileged admin requests MUST be rejected (401 or 403). A hidden UI control is not sufficient.
- **FR-004**: Blog status MUST be stored on the blog row as `draft` or `publish` and MUST NOT write the site-settings/page published snapshot.
- **FR-005**: Versioned admin contract `contracts/admin-blogs.v1.yaml` MUST remain the staff boundary.

#### Public reads (website frontend)

- **FR-006**: The backend MUST expose unauthenticated `GET /api/v1/public/blogs` (query `q`, `page`, `per_page`, maximum 10) returning only blogs with status `publish`.
- **FR-007**: The backend MUST expose unauthenticated `GET /api/v1/public/blogs/{slug}` returning one published blog. Draft or unknown slugs MUST return 404 with `code` `not_found` and `message_key` `public.blogs.not_found`.
- **FR-008**: Public list and detail MUST use separate schemas and routes from `/admin/blogs`. Public detail is identified by slug, not by staff UUID.
- **FR-009**: Public list items MUST include title, slug, description, reading_time, image_key, image_alt, authors (name, designation, writer_image_keys), and categories (name). They MUST NOT include admin `state`.
- **FR-010**: Public detail MUST include title, slug, description, body, reading_time, hero image fields, canonical and social URLs, `content_available_in`, and nested authors and categories. It MUST NOT include `status`, `author_ids`, or `category_ids`.
- **FR-011**: Versioned public contract `contracts/public-blogs.v1.yaml` MUST be published before public consumers change (constitution III). It MUST NOT be generated into the Administration FE client.
- **FR-012**: Public blog endpoints MUST NOT require a staff session and MUST NOT expose draft content.

#### Non-functional (constitution)

- **FR-013**: Public and admin error and UI strings MUST use message keys (constitution V).
- **FR-014**: Quality gates MUST cover admin auth refusal, public unauthenticated success, draft isolation on public list/detail, published-only search, and OpenAPI path parity for both contracts (constitution XIII).

### Key Entities

- **Blog**: Title, unique slug, description, body, status (`draft` | `publish`), reading time, optional hero media key, social/canonical URLs, authors, categories.
- **Author**: Named writer profile attached to blogs (many-to-many).
- **Category**: Named grouping attached to blogs (many-to-many).
- **Public blog list item**: Visitor-facing subset of a published blog for listing pages.
- **Public blog detail**: Visitor-facing published blog for a slug URL.

### Contracts

| Surface | File | Auth | Paths |
|---------|------|------|-------|
| Administration | [contracts/admin-blogs.v1.yaml](./contracts/admin-blogs.v1.yaml) | Bearer | `/admin/blogs`, `/admin/authors`, `/admin/categories`, `/admin/media` |
| Public | [contracts/public-blogs.v1.yaml](./contracts/public-blogs.v1.yaml) | None | `GET /public/blogs`, `GET /public/blogs/{slug}` |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of unauthenticated `GET /admin/blogs` requests are rejected.
- **SC-002**: 100% of unauthenticated `GET /public/blogs` and `GET /public/blogs/{published-slug}` requests succeed when published data exists.
- **SC-003**: In 100% of trials, a draft is absent from the public list and its slug returns 404 on the public detail route.
- **SC-004**: In 100% of trials, public search returns only published matches.
- **SC-005**: 100% of public detail payloads omit `status`, `author_ids`, and `category_ids`.
- **SC-006**: Both admin and public contract paths appear in the served OpenAPI document.

## Assumptions

- This feature extends `001-website-foundation` and `002-auth-rbac`. It does not replace sign-in or the page/settings snapshot pipeline.
- The website frontend MAY call public blog endpoints later (preferably at build time). This specification does not require public blog pages in this change.
- Public media fetch remains a follow-up; stored keys are enough for the API contract.
- When a later **content** Admin API is added, a matching public **read** contract and router SHOULD be added the same way. Auth, RBAC, roles, and snapshot publish MUST NOT get public counterparts.

## Constraints

- Specifications and implementations MUST keep the three-surface architecture (public frontend, backend, Administration UI).
- `/api/v1/admin/...` and `/api/v1/public/...` MUST stay separate files, schemas, and routers.
- Weakening draft isolation on public routes MUST require a documented, approved exception.
