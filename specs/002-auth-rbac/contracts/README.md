# Contracts: Authentication and Authorisation (RBAC)

OpenAPI 3.1 documents in this directory are the **single source of truth** for FR-028. Backend and Administration FE MUST consume and match these files. They **supersede** foundation `admin-auth.v1` cookie sessions and CSRF on management/publish.

Payload schemas for pages and site settings remain in `specs/001-website-foundation/contracts/` and are referenced, not copied.

## Rules

1. **Publish contracts first** — no consumer implementation before the YAML exists and passes validation.
2. **Backend implements** — routers and Pydantic models align with these files; served `/openapi.json` MUST not drift.
3. **Administration FE matches** — runtime API client and types MUST be generated from `admin-auth.v2`, `admin-rbac.v1`, `admin-management.v2`, and `publish.v2`.
4. **Breaking changes** — require a new version file; quality gates reject silent drift.
5. **Tokens** — access JWT and refresh token appear only in documented JSON bodies. Clients store them in memory and send the access token as `Authorization: Bearer`.

Runtime prefix: `/api/v1`. Public browsers MUST NOT call these endpoints for ordinary page views.

## Boundaries

| File | Boundary | Notes |
| --- | --- | --- |
| [admin-auth.v2.yaml](./admin-auth.v2.yaml) | Sign-in, refresh, sign-out, session | Replaces `001` `admin-auth.v1.yaml` |
| [admin-rbac.v1.yaml](./admin-rbac.v1.yaml) | Roles, permissions, denial shape | Shared schemas + operation map |
| [admin-management.v2.yaml](./admin-management.v2.yaml) | View/draft managed records | Bearer; no CSRF; 401 vs 403 |
| [publish.v2.yaml](./publish.v2.yaml) | Publish | Bearer; `records.publish` required |
| [bootstrap.cli.yaml](./bootstrap.cli.yaml) | Operator bootstrap CLI | Not an HTTP API |

## Consumer map

| Contract | Backend | Frontend | Administration FE |
| --- | --- | --- | --- |
| admin-auth.v2 | Implements routes | — | Generated client + in-memory token store |
| admin-rbac.v1 | Implements checks | — | Session permissions / control visibility |
| admin-management.v2 | Implements routes | — | Generated client |
| publish.v2 | Implements route | Snapshot still from `001` publish.v1 schemas | Generated client |
| bootstrap.cli | Implements CLI | — | — |

## Superseded foundation pieces

| Foundation contract | Status in this feature |
| --- | --- |
| `admin-auth.v1.yaml` | Replaced by `admin-auth.v2.yaml` |
| Cookie `admin_session` + `GET /admin/csrf` | Removed |
| `admin-management.v1.yaml` security/CSRF | Replaced by `admin-management.v2.yaml` |
| `publish.v1.yaml` cookie/CSRF | Replaced by `publish.v2.yaml` (snapshot schema unchanged) |
