# Data Model: Website Foundation

**Feature**: `001-website-foundation`  
**Date**: 2026-08-14  
**Source**: [spec.md](./spec.md) Key Entities + FR-047–FR-054

This model is the smallest persistent and file-backed shape that satisfies the specification. Marketing content types, roles, and vendor integrations are out of scope.

## Entity relationship

```text
Administrator 1──* AdminSession
Administrator 1──* ManagedRecord (as last_modified_by / published_by)

ManagedRecord ──1 SeoMetadata (embedded in payload when type = page)
ManagedRecord ──1 SiteSettings (payload when type = site_settings)

PageTemplate          (code artifact, not a table)
MessageCatalog        (JSON files, not a table)
IntegrationContract   (OpenAPI files, not a table)
AnalyticsEventSchema  (contract-only, not a table)
PublishedSnapshot     (object storage + local build input)
MediaObject           (object storage; social-preview slot)
```

---

## 1. Administrator

Provisioned staff identity. No public visitor accounts. No self-registration.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `email` | string | Unique, lowercase, valid email, required |
| `password_hash` | string | Argon2; never returned in any API or HTML |
| `is_active` | boolean | Inactive accounts cannot sign in |
| `created_at` | datetime (UTC) | Set on provision |
| `created_by` | string | Operator identifier (CLI user / env), not a public person |

**Validation**: Email unique. Password at provision time: minimum 12 characters (operator-set). Failed sign-in MUST NOT disclose whether the email exists.

**Relationships**: Has many `AdminSession`. Referenced by managed-record attribution fields.

**State**: `active` ↔ `inactive`. Inactive is treated as unknown credentials at sign-in.

---

## 2. AdminSession

Signed-in period for one administrator.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `administrator_id` | UUID | FK → Administrator |
| `token_hash` | string | Hash of the secret session token; token itself is cookie-only |
| `created_at` | datetime (UTC) | |
| `last_seen_at` | datetime (UTC) | Updated on authenticated requests |
| `idle_expires_at` | datetime (UTC) | `last_seen_at` + 30 minutes |
| `absolute_expires_at` | datetime (UTC) | `created_at` + 12 hours |
| `revoked_at` | datetime (UTC), optional | Set on sign-out |

**Validation**: A session is valid only when `revoked_at` is null, now < `idle_expires_at`, now < `absolute_expires_at`, and the administrator is active.

**State transitions**:

```text
created ──(idle or absolute timeout)──► expired
created ──(sign-out)──────────────────► revoked
expired / revoked ──► treated as signed out; no auto-publish of unsaved edits
```

**Cookie**: `HttpOnly`, `Secure` (preview/production), `SameSite=Lax`, path `/`. Not written to logs or public HTML.

---

## 3. ManagedRecord

Placeholder content or settings item with draft and published states. Only the published payload is eligible for the public static site.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `type` | enum | `site_settings` \| `page` |
| `slug` | string | Unique per type. `site_settings` uses slug `default`. Foundation page uses `home` |
| `draft_payload` | JSON | Required after first save; schema depends on `type` |
| `published_payload` | JSON, optional | Null until first publish |
| `draft_updated_at` | datetime (UTC) | |
| `draft_updated_by` | UUID | FK → Administrator |
| `published_at` | datetime (UTC), optional | |
| `published_by` | UUID, optional | FK → Administrator |

**Validation**: `type` + `slug` unique. Payloads MUST validate against the matching contract schema (`site-settings.v1` or `content.v1` + `seo-metadata.v1`). Unpublished or draft-only records MUST NOT be exported into the public snapshot as indexable pages.

**State transitions**:

```text
empty ──save draft──► draft
draft ──publish──► published
published ──save draft──► draft_ahead (public still uses published_payload)
draft_ahead ──publish──► published (published_payload replaced)
```

No delete in this phase. No scheduled publish.

**Attribution (FR-054)**: `draft_updated_by` / `draft_updated_at` and `published_by` / `published_at` are sufficient to investigate mistakes. No separate audit-product table.

---

## 4. SiteSettings (payload)

Site-wide defaults. Distinct from per-page SEO metadata. Editable in the Administration UI; only published values appear on the public site.

| Field | Type | Rules |
| --- | --- | --- |
| `site_name` | message key or string ref | Placeholder; not a real brand name invented as fact |
| `default_locale` | string | Foundation: `en` |
| `locale_url_strategy` | enum | `unprefixed_default` (documented; later locales use `/{locale}/`) |
| `robots_policy` | enum | `index_public` (public indexable; admin/API excluded) |
| `default_social_image_key` | string, optional | Object-storage key for the image slot |
| `canonical_origin` | URI | Production/preview origin used to build canonical URLs |

**Validation**: `default_locale` MUST exist in the message catalogs. `canonical_origin` MUST be `https` in preview/production.

---

## 5. Page (payload) and SEO Metadata

Per-page public shape stored inside a `ManagedRecord` of type `page`.

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Unique among indexable public pages; required to publish if `indexable` |
| `description` | string | Unique among indexable public pages; required to publish if `indexable` |
| `canonical_path` | string | Absolute path, no origin; required |
| `indexable` | boolean | If false: excluded from sitemap; robots/canonical must not present it as a landing page |
| `social_title` | string | Defaults to `title` if empty |
| `social_description` | string | Defaults to `description` if empty |
| `social_image_key` | string, optional | Object-storage key; slot may be empty |
| `primary_heading` | string | Exactly one H1 source |
| `summary` | string | Concise extractable region (AEO/snippets) |
| `body` | string | Longer body; may be placeholder copy via message keys |
| `structured_data_templates` | string[] | Subset of `organization`, `web_page`, `faq` — templates only, no invented facts |

**Validation (quality gates + publish)**: Indexable pages MUST have unique title, description, and canonical path, and exactly one primary heading. Missing required metadata fails gates and MUST NOT promote (spec edge case).

---

## 6. PageTemplate (code artifact)

Reusable public page shape. Not stored in PostgreSQL.

| Concern | Rule |
| --- | --- |
| Layout regions | Header, main, footer, skip-to-content, summary, body |
| Heading hierarchy | Exactly one `h1`; nested `h2+` only |
| Metadata slots | Bound from published page payload + site settings |
| Delivery | Pre-rendered HTML; usable with scripting disabled |

Foundation ships one template used by the `home` placeholder route. Adding a route follows the same template and helpers (User Story 2).

---

## 7. MessageCatalog / Message Key

Externalised user-facing strings for public and administration surfaces.

| Field | Type | Rules |
| --- | --- | --- |
| `key` | string | Dot-namespaced, e.g. `admin.sign_in.submit` |
| `locale` | string | Foundation ships `en` only |
| `value` | string | The copy |

**Storage**: `apps/Frontend/src/i18n/en.json` and `apps/Administration-FE/src/i18n/en.json`.  
**Validation**: Quality gates fail if a template contains a hard-coded user-facing string (FR-027, SC-004). Keys may be added without a schema migration.

---

## 8. IntegrationContract

Versioned, machine-readable backend boundary. Files, not rows.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | filename | See [contracts/](./contracts/) — **single source of truth** |
| `version` | `v1` | Breaking changes require a new version file |
| `format` | OpenAPI 3.1 | Validated by quality gates; Backend implements; Frontend and Administration FE MUST consume and match |

Boundaries in this phase: SEO metadata, content, site settings, admin sign-in, admin management, publish, form submission (stub), newsletter (stub), analytics events (stub).

---

## 9. AnalyticsEventSchema

Named events and properties for later measurement. Privacy-conscious; vendor-agnostic. Not an implemented tracker.

Defined only in [contracts/analytics-events.v1.yaml](./contracts/analytics-events.v1.yaml). No table, no client beacon in foundation.

---

## 10. PublishedSnapshot

Build-time input for `apps/Frontend`. Visitors never fetch this at browse time.

| Field | Type | Rules |
| --- | --- | --- |
| `revision` | string | Publish id / timestamp |
| `site_settings` | SiteSettings | Published payload only |
| `pages` | Page[] | Published, and only those eligible for public HTML |
| `written_at` | datetime (UTC) | |

**Storage**: Object storage key `exports/{environment}/published.json` plus a local copy at `apps/Frontend/src/data/published.json` after export.  
**Rule**: Draft payloads MUST NOT appear. Non-indexable pages MAY appear in HTML if a public route exists, but MUST be absent from the sitemap.

---

## 11. MediaObject

Object-storage object for the social-preview image slot (and later media).

| Field | Type | Rules |
| --- | --- | --- |
| `key` | string | Unique object key |
| `content_type` | string | Image types only in this phase |
| `byte_size` | integer | Enforced max (1 MiB) for foundation placeholders |

Server-only credentials. Public pages reference a static URL written at build time, not the private bucket API.

---

## Validation rules (cross-cutting)

- Public export includes only `published_payload`.
- Administration responses never embed password hashes, raw session tokens, or server-only storage credentials.
- Preview and production builds of the same snapshot revision MUST produce equivalent public HTML.
- Locale-specific copy lives in message catalogs, not in payload fields that are rendered as raw UI chrome (page title/description are content, not chrome).

## Out of model (explicit)

Roles beyond a single administrator capability, password recovery, SSO, scheduled publish, DAM, legal review, public visitor accounts, live forms, newsletter delivery, and analytics vendors.
