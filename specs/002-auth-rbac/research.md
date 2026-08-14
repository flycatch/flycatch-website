# Research: Authentication and Authorisation (RBAC)

**Feature**: `002-auth-rbac`  
**Date**: 2026-08-14  
**Status**: Complete — all Technical Context items resolved

This feature extends `001-website-foundation`. Stack, surfaces, and public static delivery stay the same. The plan input requires **JWT access tokens plus required refresh tokens**, both held in **Administration FE memory**, with the access token sent as `Authorization: Bearer`. That choice supersedes the foundation cookie session for staff authentication.

---

## 1. Authentication mechanism (JWT + refresh)

**Decision**: Password sign-in issues **both** an access JWT and an opaque refresh token. Refresh tokens are mandatory (not optional, not a later add-on). The access token is a signed JWT (HS256 via PyJWT). The refresh token is a high-entropy opaque secret stored only as a hash on a server-backed session row. Idle timeout remains 30 minutes and absolute lifetime remains 12 hours, both enforced on the refresh session (same values as the foundation). Access JWT lifetime is **15 minutes**.

**Rationale**: The plan input requires JWT + refresh. The specification still requires a server-backed session with idle and absolute timeouts (FR-004), generic credential failures (FR-006), and request-time authorisation (FR-015). A short-lived JWT carries identity only; a hashed refresh record is the revocable session. Permissions MUST NOT be trusted from JWT claims.

**Access JWT claims** (identity only):

| Claim | Meaning |
| --- | --- |
| `sub` | Administrator UUID |
| `sid` | Refresh-session UUID (so sign-out can revoke without the refresh body) |
| `typ` | Constant `access` |
| `iat`, `exp`, `jti` | Issued-at, expiry, unique id |

**Alternatives considered**:

- **Keep foundation HttpOnly cookie session**: Simpler and already implemented, but rejected by the plan input.
- **JWT only, no refresh**: Cannot meet 30-minute idle / 12-hour absolute session rules without a long-lived access token, which cannot be revoked promptly.
- **Refresh JWT (signed, not stored)**: Harder to revoke and rotate; opaque hashed refresh is the server-backed session FR-004 requires.
- **Put roles/permissions in the access JWT**: Violates FR-015 (stale grants after role change).

---

## 2. Token storage and transport

**Decision**: Administration FE stores `access_token` and `refresh_token` in **process memory only** (module-level store or React context). Neither token is written to `localStorage`, `sessionStorage`, cookies, or HTML. Every protected Administration API request sends `Authorization: Bearer <access_token>`. The client MUST NOT use `credentials: 'include'` for session cookies. After a successful sign-in, the workspace MUST switch view **without** a full document navigation (`window.location`); a reload clears memory and is treated as signed out.

**Rationale**: Plan input. FR-007 forbids durable client storage that is not required. Memory is required for Bearer auth and is lost on reload, which is accepted. Full-page redirects after sign-in (current `SignInForm` / `AdminShell` behaviour) would drop the tokens and MUST be removed.

**Refresh behaviour**: On `401` from an expired access token, the client calls `POST /admin/auth/refresh` once with the in-memory refresh token, replaces both tokens, and retries the original request. Failure or a missing refresh token is treated as signed out.

**Alternatives considered**:

- **`localStorage` / `sessionStorage`**: Survives reload but is readable by XSS and is durable client storage FR-007 rejects.
- **HttpOnly cookie for refresh + memory for access**: Hybrid; still uses cookies the plan input forbids for these tokens.
- **Keep `window.location` after sign-in**: Wipes memory; incompatible with the storage rule.

---

## 3. CSRF and the foundation cookie/CSRF pair

**Decision**: Remove the Administration CSRF synchronizer (`X-CSRF-Token` and `GET /admin/csrf`) for this feature. Bearer tokens in an `Authorization` header are not sent automatically by the browser on cross-site form posts, which satisfies FR-004 (“credentials MUST NOT be usable as a cross-site request”). Foundation `admin-auth.v1`, cookie `admin_session`, and CSRF on management/publish mutations are **superseded** by `admin-auth.v2` plus Bearer on management/publish v2 contracts.

**Rationale**: CSRF tokens exist to protect cookie-authenticated mutations. They add weight and a confused 403 (`csrf_failed` vs permission denial). Bearer-in-header is the CSRF mitigation.

**Alternatives considered**:

- **Keep CSRF alongside Bearer**: Extra round-trip and a second failure mode; not required once cookies are gone.
- **SameSite cookie + CSRF**: Foundation approach; rejected by the JWT/Bearer input.

---

## 4. Authorisation model (RBAC)

**Decision**: Named permissions are a **fixed catalogue** stored as an enum on `role_permissions`, not a freely editable permission table. Roles are rows. A user may have many roles; effective permissions are the **union**. Default roles:

| Role | Permissions |
| --- | --- |
| `administrator` | `records.view`, `drafts.save`, `records.publish` |
| `editor` | `records.view`, `drafts.save` |

Enforcement is server-side on every protected action. The workspace hides or disables controls using the session payload; hiding is not sufficient (FR-012).

**Request-time evaluation**: After JWT validation, the backend loads the administrator, rejects inactive users as **unauthenticated** (401), loads current role assignments, and checks the required permission. Missing permission → **403** `permission_denied` while the session remains valid (FR-016). Unauthenticated → **401**, never 403 (FR-013).

**Operation map**:

| Action | Permission |
| --- | --- |
| GET managed record (site settings, page) | `records.view` |
| PATCH draft | `drafts.save` |
| POST publish | `records.publish` |
| Sign-in / refresh / sign-out / session | Authenticated session only (no RBAC permission) |

**Alternatives considered**:

- **Permission rows as a product table**: Over-modelled for three fixed actions.
- **One role per user**: Rejected by FR-009 (union of multiple roles).
- **Evaluate permissions only at sign-in**: Violates FR-015.

---

## 5. Bootstrap and provisioning

**Decision**: Operator CLI `flycatch-bootstrap` (new Backend entry point) creates the two default roles and at least two users in one transaction-like fail-closed run. Identities and secrets come from flags or prompts — never from committed defaults. Idempotent on role `name` and user `email`. At least one user receives `administrator`; the second defaults to `administrator` unless `--user-2-role editor` is set. Existing `flycatch-provision-admin` gains a required `--role` from the catalogue.

**Rationale**: FR-017–FR-024. No Administration UI for users or roles. Bootstrap is not an HTTP API.

**Alternatives considered**:

- **HTTP bootstrap endpoint**: Would be a public or semi-public account-creation path; out of scope.
- **Seed passwords in `.env.example`**: Forbidden by FR-020.
- **Only one default user**: Violates the two-user requirement.

---

## 6. Contract versioning

**Decision**: Publish new OpenAPI 3.1 files in `specs/002-auth-rbac/contracts/`. `admin-auth.v2.yaml` replaces `001` `admin-auth.v1.yaml` (breaking: tokens in JSON, Bearer, refresh). `admin-management.v2.yaml` and `publish.v2.yaml` replace cookie + CSRF with Bearer and distinguish 401 vs 403 `permission_denied`. `admin-rbac.v1.yaml` is the permission/role/denial catalogue. Payload schemas for pages and site settings stay referenced from `001` contracts. CLI bootstrap is documented as `bootstrap.cli.yaml`.

**Rationale**: Constitution III and foundation rule that breaking changes get a new version file. Administration FE MUST generate types from the v2/v1 files in this feature directory.

**Alternatives considered**:

- **Patch 001 v1 files in place**: Silent breaking change; rejected.
- **Single mega-spec**: Harder to review; inconsistent with foundation file-per-boundary.

---

## 7. Libraries and secrets

**Decision**: Add **PyJWT** (`PyJWT[crypto]` not required for HS256) on the Backend. Reuse Argon2 for passwords. Hash refresh tokens with SHA-256 plus `session_secret` (same pattern as foundation session tokens). Add `jwt_secret` (HS256 signing key) and `jwt_access_minutes` (default 15). Do not add Redis or a token denylist; revocation is the refresh-session row.

**Rationale**: PyJWT is the maintained Python JWT library. A denylist for every access JWT would add infrastructure the scale does not need; 15-minute expiry plus inactive-user checks on each request is enough.

**Alternatives considered**:

- **python-jose**: Less actively maintained.
- **Redis session store**: Extra infrastructure; PostgreSQL already holds sessions.
- **RS256 key pair**: Unnecessary for a single Backend signing its own tokens.

---

## 8. Administration FE session UX

**Decision**: One hydrated React island owns auth state. Sign-in success writes both tokens to memory and renders the workspace in the same document. Sign-out calls the revoke endpoint, clears memory, and shows sign-in in the same document. Publish/draft controls are omitted or `disabled` + `aria-disabled` when the session payload lacks the permission; denial copy uses `admin.action.forbidden` (already in the catalogue).

**Rationale**: Memory storage cannot survive `window.location` hops. Native form controls stay (constitution II, IX). No new UI kit.

**Alternatives considered**:

- **Separate Astro pages for sign-in vs workspace with full navigation**: Incompatible with in-memory tokens unless storage is persisted.

---

## 9. Testing and quality gates

**Decision**: Extend existing pytest / Playwright / axe / OpenAPI gates. New gates:

| Gate | Must prove |
| --- | --- |
| Bootstrap | Two users, two roles, idempotent re-run, fail-closed on missing secrets |
| Sign-in | 200 + both tokens; wrong password / unknown email / inactive → same generic 401, zero sessions |
| Refresh | Required; rotates refresh hash; idle/absolute expiry → 401 |
| Bearer | Protected routes reject missing/invalid `Authorization` as 401 |
| RBAC grant | Administrator can view, draft, publish |
| RBAC deny | Editor draft succeeds; publish (UI and direct POST) is 403; user stays signed in |
| Contracts | Served OpenAPI and Administration FE types match `002` contracts |
| i18n / a11y | Message keys only; WCAG 2.2 AA on sign-in and denial |
| Public non-regression | No admin JS or tokens on public pages; sitemap still excludes `/admin` |

**Rationale**: FR-030, SC-001–SC-009, constitution XIII.

---

## 10. Public site and performance

**Decision**: No changes to `apps/Frontend` templates, budgets, or Core Web Vitals targets. This feature MUST NOT add script or layout weight to public pages. Administration UI remains exempt from ranking vitals (foundation FR-044) and MUST stay usable on supported viewports.

**Rationale**: Spec non-regression for constitution I, VI, VII.

---

## Clarifications resolved

| Item | Resolution |
| --- | --- |
| Auth product | JWT access + required opaque refresh; not cookie session |
| Token storage | Frontend memory only; Bearer header |
| Session timeouts | Idle 30 min and absolute 12 h on refresh session; access JWT 15 min |
| Permission source of truth | Database role assignments at request time |
| CSRF | Removed for admin mutations; Bearer is the mitigation |
| Bootstrap | Operator CLI, not an HTTP API |
| Sign-up | Still absent |
| Extra stores | None (no Redis) |
