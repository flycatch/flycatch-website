# Data Model: Authentication and Authorisation (RBAC)

**Feature**: `002-auth-rbac`  
**Date**: 2026-08-14  
**Source**: [spec.md](./spec.md) Key Entities + FR-001–FR-024  
**Extends**: [001-website-foundation/data-model.md](../001-website-foundation/data-model.md)

This model adds roles, permissions, and a refresh-token session. It does not add public visitor accounts, a user-management UI, or new content types.

## Entity relationship

```text
Administrator 1──* AdministratorRole *──1 Role
Role          1──* RolePermission        (permission enum)

Administrator 1──* RefreshSession        (hashed refresh token; access JWT not stored)

Administrator 1──* ManagedRecord         (attribution; unchanged from foundation)
```

---

## 1. Administrator (extended)

Provisioned staff identity. Unchanged core fields from the foundation.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `email` | string | Unique, lowercase, valid email, required |
| `password_hash` | string | Argon2; never returned in any API or HTML |
| `is_active` | boolean | Inactive accounts cannot sign in; existing refresh sessions MUST be treated as signed out |
| `created_at` | datetime (UTC) | Set on provision or bootstrap |
| `created_by` | string | Operator identifier (CLI / env), not a public person |

**Validation**: Email unique. Password at provision/bootstrap: minimum 12 characters (operator-set). Failed sign-in MUST NOT disclose whether the email exists, whether the user is inactive, or which roles they have.

**Relationships**: Many `AdministratorRole`; many `RefreshSession`.

**State**: `active` ↔ `inactive`. Inactive is treated as unknown credentials at sign-in and as unauthenticated on subsequent requests (401, not 403).

**New rule**: Newly provisioned users MUST be assigned at least one role from the catalogue (FR-023).

---

## 2. Role

Named set of permissions. Does not sign in.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `name` | string | Unique, lowercase slug. Catalogue: `administrator`, `editor` |
| `created_at` | datetime (UTC) | |

**Validation**: `name` unique. Bootstrap MUST create both catalogue names. Repeat bootstrap MUST NOT duplicate.

**Default catalogue** (FR-010):

| `name` | Permissions |
| --- | --- |
| `administrator` | `records.view`, `drafts.save`, `records.publish` |
| `editor` | `records.view`, `drafts.save` |

`editor` MUST NOT include `records.publish`.

---

## 3. Permission (catalogue, not a free table)

Named capability mapped to one existing administration action. Stored as an enum on `role_permissions.permission`, not as an editable product table.

| Value | Meaning | Enforced on |
| --- | --- | --- |
| `records.view` | View managed records | `GET /admin/site-settings`, `GET /admin/pages/{slug}` |
| `drafts.save` | Save drafts | `PATCH` draft endpoints |
| `records.publish` | Publish | `POST /admin/publish` |

No other permission names in this feature.

---

## 4. RolePermission

Link between a Role and one Permission.

| Field | Type | Rules |
| --- | --- | --- |
| `role_id` | UUID | FK → Role, part of primary key |
| `permission` | enum | One of the catalogue values; part of primary key |

**Validation**: Unique `(role_id, permission)`. Bootstrap sets the default grants in FR-010.

---

## 5. AdministratorRole (role assignment)

Link between a staff user and a Role.

| Field | Type | Rules |
| --- | --- | --- |
| `administrator_id` | UUID | FK → Administrator, part of primary key |
| `role_id` | UUID | FK → Role, part of primary key |
| `assigned_at` | datetime (UTC) | |
| `assigned_by` | string | Operator identifier |

**Validation**: Unique `(administrator_id, role_id)`. A user MAY have more than one role.

**Effective permissions**: Union of all assigned roles’ permissions (FR-009). A user with no roles or only empty roles MAY sign in if active; every protected mutation MUST be denied (403).

**Request-time rule**: Protected actions MUST load current assignments. A grant captured at sign-in MUST NOT remain authoritative after roles change (FR-015).

---

## 6. RefreshSession (evolves AdminSession)

Server-backed signed-in period. Replaces the foundation cookie session. The **refresh token** is the secret; the access JWT is not stored.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key; copied into access JWT `sid` |
| `administrator_id` | UUID | FK → Administrator |
| `refresh_token_hash` | string | SHA-256 of `session_secret + refresh_token`; never the raw token |
| `family_id` | UUID | Rotation family; reuse of a revoked token in the family MUST revoke the family |
| `created_at` | datetime (UTC) | Absolute lifetime starts here |
| `last_seen_at` | datetime (UTC) | Updated on successful refresh or authenticated use that extends idle |
| `idle_expires_at` | datetime (UTC) | `last_seen_at` + 30 minutes |
| `absolute_expires_at` | datetime (UTC) | `created_at` + 12 hours |
| `revoked_at` | datetime (UTC), optional | Set on sign-out, rotation (old row), or family revoke |

**Validation**: A session is valid only when `revoked_at` is null, now < `idle_expires_at`, now < `absolute_expires_at`, and the administrator is active.

**State transitions**:

```text
created ──(refresh)──► rotated (old hash revoked; new hash same family_id)
created ──(idle or absolute timeout)──► expired
created ──(sign-out)──────────────────► revoked
rotated/expired/revoked ──► treated as signed out; no auto-publish of unsaved edits
reuse of a revoked refresh in the family ──► family revoked
```

**Access JWT** (not a row): HS256, 15-minute `exp`, claims `sub`, `sid`, `typ=access`, `iat`, `exp`, `jti`. MUST NOT contain roles or permissions.

**Client**: Both tokens live in Administration FE memory only. Access token is sent as `Authorization: Bearer`. Neither token is a cookie.

---

## 7. TokenPair (API shape, not persisted)

Returned by sign-in and refresh. See [admin-auth.v2.yaml](./contracts/admin-auth.v2.yaml).

| Field | Type | Rules |
| --- | --- | --- |
| `access_token` | string | JWT; write-once in the response |
| `refresh_token` | string | Opaque; write-once in the response |
| `token_type` | string | Constant `bearer` |
| `expires_in` | integer | Access TTL in seconds (900) |
| `session` | SessionContext | Identity + current roles/permissions + expiries |

Tokens MUST NOT appear in logs, public HTML, or durable client storage.

---

## 8. SessionContext (API shape)

Returned on sign-in, refresh, and `GET /admin/auth/session`. Roles and permissions are computed from **current** assignments, not from JWT claims.

| Field | Type | Rules |
| --- | --- | --- |
| `administrator_id` | UUID | |
| `email` | string | |
| `roles` | string[] | Role `name` values, sorted |
| `permissions` | string[] | Union of assigned permissions, sorted |
| `idle_expires_at` | datetime (UTC) | From the refresh session |
| `absolute_expires_at` | datetime (UTC) | From the refresh session |

---

## 9. PermissionDenied (API shape)

Used when the caller is authenticated but lacks the required permission.

| Field | Type | Rules |
| --- | --- | --- |
| `code` | string | `permission_denied` |
| `message_key` | string | `admin.action.forbidden` |
| `permission` | string | The catalogue value that was required |

Must not be used for missing/invalid/expired tokens or inactive users (those are `AuthError` / 401).

---

## 10. Bootstrap set (operator input, not a table)

| Input | Rules |
| --- | --- |
| User 1 email + password | Required; password ≥ 12 characters |
| User 2 email + password | Required; distinct email; password ≥ 12 characters |
| User 2 role | Optional; `administrator` (default) or `editor` |
| User 1 role | Always `administrator` (FR-018) |

**Behaviour**: Create default roles and permissions if missing; create missing users; assign roles; do not duplicate existing matching emails or role names; fail closed if any required input is missing (no users without roles, no partial default role catalogue). Secrets MUST NOT be logged or written to public pages.

---

## Validation rules (cross-cutting)

- Public export and public HTML never include tokens, password hashes, roles, or staff emails.
- Administration responses never embed password hashes or raw refresh/access tokens except in the documented sign-in/refresh JSON body.
- Unauthenticated protected actions → 401. Insufficient permission → 403. The two MUST NOT be interchangeable.
- Message keys for sign-in and denial live in `apps/Administration-FE/src/i18n/en.json`.

## Out of model (explicit)

Self-registration, password recovery, SSO, user/role admin screens, per-record ACLs, public visitor accounts, durable browser token storage, and permission names beyond the three-action catalogue.
