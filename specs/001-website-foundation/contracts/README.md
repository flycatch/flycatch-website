# Contracts: Website Foundation

OpenAPI 3.1 documents in this directory are the **single source of truth** for FR-034. Backend, Frontend, and Administration FE MUST all consume and match these files.

## Rules

1. **Publish contracts first** — no consumer implementation before the YAML exists and passes validation.
2. **Backend implements** — routers and Pydantic models align with these files; served `/openapi.json` MUST not drift.
3. **Frontend matches** — build-time snapshot and content types MUST be generated from or validated against `content.v1`, `site-settings.v1`, `seo-metadata.v1`, and `publish.v1`.
4. **Administration FE matches** — runtime API client and types MUST be generated from `admin-auth.v1`, `admin-management.v1`, and `publish.v1`.
5. **Breaking changes** — require a new `v2` file; quality gates reject silent drift.

Runtime prefix: `/api/v1`. Public browsers MUST NOT call these endpoints for ordinary page views.

## Boundaries

| File | Boundary | Implemented in this phase |
| --- | --- | --- |
| [seo-metadata.v1.yaml](./seo-metadata.v1.yaml) | Per-page SEO metadata schema | Yes (build-time + admin payloads) |
| [content.v1.yaml](./content.v1.yaml) | Public page / content schema | Yes (placeholder page) |
| [site-settings.v1.yaml](./site-settings.v1.yaml) | Site-wide settings | Yes |
| [admin-auth.v1.yaml](./admin-auth.v1.yaml) | Sign-in, session, sign-out | Yes |
| [admin-management.v1.yaml](./admin-management.v1.yaml) | Draft view/edit of managed records | Yes |
| [publish.v1.yaml](./publish.v1.yaml) | Publish + published snapshot | Yes |
| [form-submission.v1.yaml](./form-submission.v1.yaml) | Public form intake | Stub only |
| [newsletter.v1.yaml](./newsletter.v1.yaml) | Newsletter signup | Stub only |
| [analytics-events.v1.yaml](./analytics-events.v1.yaml) | Analytics event names/properties | Stub only |

## Consumer map

| Contract | Backend | Frontend | Administration FE |
| --- | --- | --- | --- |
| seo-metadata.v1 | Payload validation | Build-time types | Edit forms |
| content.v1 | Payload validation | Build-time types | Edit forms |
| site-settings.v1 | Payload validation | Build-time types | Edit forms |
| admin-auth.v1 | Implements routes | — | Generated client |
| admin-management.v1 | Implements routes | — | Generated client |
| publish.v1 | Implements routes | Snapshot validation | Generated client |
| form-submission.v1 | Stub 501 | — | — |
| newsletter.v1 | Stub 501 | — | — |
| analytics-events.v1 | Schema only | — | — |
