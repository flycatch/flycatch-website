# Feature Specification: Authentication and Authorisation (RBAC)

**Feature Branch**: `002-auth-rbac`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Define Authentication & Authorization: Password-based authentication; user sign-up is not required. RBAC using roles and permissions. Bootstrap mechanism for creating at least two default administrative users and their roles. Keep the design minimal and aligned with the existing architecture."

**Constitution alignment**: This specification implements mandatory governance from `.specify/memory/constitution.md` (v1.0.0). Requirements trace primarily to principles VIII (security), III (contract-first), V (i18n), IX (accessibility), II (native elements), VI (performance), XI (responsive UI), XII (production-grade), and XIII (quality gates). Public SEO/AEO (I) and Core Web Vitals (VII) apply only as a non-regression: this feature MUST NOT weaken public delivery or expose the Administration UI to search.

## Scope

This feature **defines** staff authentication and authorisation for the existing Administration UI. It extends the foundation’s provisioned-administrator model; it does not add public visitor accounts or a new product surface.

### In scope

- Password-based sign-in and sign-out for provisioned staff (no self-service sign-up)
- Role-based access control: roles grant named permissions; a staff member’s allowed actions are the union of permissions from their assigned roles
- Server-side enforcement of every protected administration action (the workspace MAY hide unauthorised controls; hiding is not sufficient)
- A one-time, operator-run bootstrap that creates the default roles and at least two default administrative users, then assigns those users their roles
- Session context that tells the signed-in workspace which actions the person may perform
- Accessible, internationalised sign-in and permission-denied messages consistent with the Administration UI baselines

### Out of scope

- Public visitor accounts, customer login, or any authenticated public area
- Self-service registration, invitation links, or “create account” on the sign-in screen
- Single sign-on, social login, or third-party identity providers
- Self-service password recovery, reset, or email verification
- An Administration UI for creating users, editing roles, or assigning permissions (operators use bootstrap and the existing operator provisioning path)
- Per-record or per-field access lists, approval workflows, or legal-review products
- Changing public static delivery, publish mechanics, or content models beyond checking the caller’s permission

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operator bootstraps default users and roles (Priority: P1)

An authorised operator prepares a new environment so staff can sign in. They run the documented bootstrap once. The system creates the default roles, creates at least two administrative users, assigns each user their role(s), and confirms success without exposing secrets in logs or public pages. After bootstrap, those users can sign in; nobody else can register themselves.

**Why this priority**: Without bootstrap, the Administration UI has no first users and no roles. Everything else depends on this.

**Independent Test**: Run bootstrap on an empty environment, confirm two users and the default roles exist with assignments, then sign in as each bootstrapped user. Do not open a sign-up screen.

**Acceptance Scenarios**:

1. **Given** an environment with no staff users, **When** an operator completes bootstrap with the documented inputs (identities and secrets for at least two users), **Then** at least two active administrative users exist, each assigned at least one default role
2. **Given** bootstrap has completed, **When** the default role catalogue is inspected, **Then** it includes an Administrator role with every administration permission and an Editor role with view and draft permissions only (no publish)
3. **Given** bootstrap has completed, **When** a person visits the Administration UI, **Then** they see sign-in only — there is no sign-up, register, or create-account action
4. **Given** bootstrap has already created the default users and roles, **When** the operator runs bootstrap again with the same identities, **Then** the system does not create duplicate users or roles and reports that the defaults already exist
5. **Given** bootstrap credentials, **When** they are stored or displayed, **Then** secrets are never written to public pages, client-delivered assets, or ordinary application logs

---

### User Story 2 - Provisioned staff member signs in with a password (Priority: P1)

A bootstrapped or later-provisioned staff member opens the Administration UI, enters their email and password, and reaches the workspace. Failed attempts do not reveal whether the email exists. There is no path to create an account from this screen.

**Why this priority**: Password sign-in is the only way staff reach administration. If this fails, roles never matter.

**Independent Test**: Sign in with a valid bootstrapped account; retry with a wrong password and with an unknown email; confirm both failures look the same and no session is created.

**Acceptance Scenarios**:

1. **Given** an active provisioned user and a correct password, **When** they submit sign-in, **Then** they reach the Administration UI and the workspace knows which roles and permissions they have
2. **Given** a wrong password or an unknown email, **When** they submit sign-in, **Then** access is denied with the same generic message, no session is created, and the response does not say whether the account exists
3. **Given** an inactive provisioned user and the correct password, **When** they submit sign-in, **Then** access is denied with the same generic message as an unknown account
4. **Given** the sign-in screen, **When** a visitor looks for a way to register, **Then** no sign-up control or self-service account-creation path is available
5. **Given** a signed-in user, **When** they sign out, **Then** further administration requests do not show staff-only content until they sign in again

---

### User Story 3 - Authorised staff member performs an allowed action (Priority: P2)

A signed-in staff member whose roles include the required permission completes an existing administration action (view a record, save a draft, or publish). The backend accepts the action. The workspace shows the controls they are allowed to use.

**Why this priority**: Authentication without usable authorisation does not change staff work. This story proves permissions grant access to the existing draft/publish path.

**Independent Test**: Sign in as a user whose roles include draft and publish; view a placeholder record, save a draft, and publish; confirm each step succeeds.

**Acceptance Scenarios**:

1. **Given** a signed-in user whose effective permissions include viewing records, **When** they open a managed record they are allowed to see, **Then** the workspace shows the record and does not treat them as unauthorised
2. **Given** a signed-in user whose effective permissions include saving drafts, **When** they save a draft, **Then** the draft is stored and the public site is unchanged
3. **Given** a signed-in user whose effective permissions include publish, **When** they publish, **Then** the documented publish path completes as in the foundation
4. **Given** a user assigned more than one role, **When** their access is evaluated, **Then** they receive every permission from any of those roles (union, not intersection)

---

### User Story 4 - Staff member is denied an action they are not permitted to perform (Priority: P2)

A signed-in Editor (or any user whose roles lack publish) tries to publish. The workspace does not offer a working publish control, and a direct request to publish is refused. The user remains signed in and can still perform actions they are allowed.

**Why this priority**: RBAC only has value if missing permissions are enforced on the server, not only hidden in the interface.

**Independent Test**: Sign in as a user who has view and draft but not publish; confirm publish is refused in the workspace and by a direct request; confirm draft save still works.

**Acceptance Scenarios**:

1. **Given** a signed-in user whose roles do not include publish, **When** they view a record they may draft, **Then** they can save a draft and they cannot complete publish
2. **Given** that same user, **When** a publish request is sent anyway, **Then** the system refuses it, does not change the published site, and leaves them signed in
3. **Given** a signed-in user with no permission for a given action, **When** the workspace renders that action, **Then** the control is absent or clearly disabled and the denial message is accessible and uses a message key
4. **Given** an unauthenticated person, **When** they request a protected administration action, **Then** they are treated as signed out (not as “permission denied”) and see no staff-only content

---

### Edge Cases

- Bootstrap is run with missing required user identities or secrets — it MUST fail without creating a partial, unusable default set (no users without roles, no roles without the documented defaults)
- Bootstrap is run when one of the two default users already exists and the other does not — it MUST create only the missing user and MUST NOT duplicate the existing one
- A user has no roles, or only roles with no permissions — they MAY sign in if active, but every protected mutation MUST be denied
- A user’s roles are changed after they signed in — subsequent protected actions MUST use current assignments, not a stale grant from sign-in time
- Session idle or absolute timeout — the person MUST be treated as signed out; unsaved edits MUST NOT publish themselves
- Concurrent sign-in from another browser — existing session rules from the foundation still apply; authorisation is evaluated per request
- Inactive user with a still-valid-looking session — they MUST be treated as signed out
- Failed sign-in MUST NOT disclose whether the email exists, whether the user is inactive, or what roles they would have
- Public site requests MUST remain unauthenticated and MUST NOT depend on staff roles
- Direct requests to Administration UI addresses by crawlers MUST remain non-indexable and MUST NOT leak staff identities, roles, or permissions in public HTML

## Requirements *(mandatory)*

### Functional Requirements

#### Password authentication (no sign-up)

- **FR-001**: Staff MUST sign in to the Administration UI with an email and a password. No other sign-in method is in this feature.
- **FR-002**: The system MUST NOT offer or accept self-service sign-up, registration, or account creation from the Administration UI or any public page.
- **FR-003**: Only provisioned, active users MUST be able to sign in. Inactive or unknown credentials MUST be rejected with the same generic error.
- **FR-004**: Sign-in MUST create a server-backed session with idle timeout and absolute lifetime consistent with the foundation. Credentials MUST NOT be usable as a cross-site request to change administration data.
- **FR-005**: Sign-out MUST end the session. After sign-out, administration content MUST NOT remain usable from the same browser without signing in again.
- **FR-006**: Failed sign-in MUST NOT disclose whether an account exists, whether it is inactive, or which roles it has.
- **FR-007**: Credentials and session secrets MUST NOT appear in public HTML, ordinary logs, or client storage that is not required for the session to function.
- **FR-008**: Sign-in and sign-out MUST remain on the existing Administration UI surface and MUST reuse the existing staff session boundary (extended only as needed to carry authorisation context).

#### Roles and permissions

- **FR-009**: Access to protected administration actions MUST be determined by RBAC: a **Role** is a named set of **Permissions**; a user is assigned one or more roles; effective permissions are the union of those roles’ permissions.
- **FR-010**: The default role catalogue MUST include at least:
  - **Administrator** — every permission in this feature’s permission catalogue
  - **Editor** — view and draft permissions only; MUST NOT include publish
- **FR-011**: The permission catalogue MUST stay minimal and MUST map to existing administration actions only:
  - view managed records
  - save drafts
  - publish
- **FR-012**: The backend MUST refuse any protected action when the signed-in user lacks the matching permission. A hidden or disabled control in the workspace is not sufficient.
- **FR-013**: Unauthenticated requests to protected actions MUST be rejected as unauthenticated, not as insufficient permission.
- **FR-014**: After a successful sign-in (and on session check), the workspace MUST receive the user’s identity plus their role names and effective permissions so it can show only allowed controls.
- **FR-015**: Authorisation for a protected action MUST be evaluated from current role assignments at request time, not from a grant that cannot be revoked until the session ends.
- **FR-016**: A signed-in user who lacks permission MUST remain signed in; the refusal MUST use an accessible, internationalised message and MUST NOT perform the action.

#### Bootstrap of default users and roles

- **FR-017**: An operator-run bootstrap MUST create the default roles (Administrator and Editor) and at least two default administrative users, and MUST assign each of those users at least one role.
- **FR-018**: At least one of the two default users MUST be assigned the Administrator role so the environment is not left without a fully authorised operator.
- **FR-019**: The second default user MUST also be assigned a default role from the catalogue (Administrator or Editor) as specified by the operator input; if the operator does not choose, the second user MUST receive the Administrator role.
- **FR-020**: Bootstrap MUST require the operator to supply each default user’s identity and secret. Defaults MUST NOT ship with a well-known password in the product.
- **FR-021**: Bootstrap MUST be idempotent for the default role names and the supplied user identities: a repeat run MUST NOT create duplicates and MUST leave existing matching users and roles intact.
- **FR-022**: Bootstrap MUST fail closed if required inputs are missing or invalid, without leaving users who cannot sign in or roles that do not match FR-010.
- **FR-023**: Additional staff MAY be added later only through the existing operator provisioning path (not through sign-up). Newly provisioned users MUST be assigned at least one role from the catalogue.
- **FR-024**: Bootstrap and provisioning are operator actions. They MUST NOT be available as self-service Administration UI screens in this feature.

#### Non-functional (constitution)

- **FR-025**: User-facing strings for sign-in, sign-out, validation, and permission denial MUST be externalised as message keys (constitution V).
- **FR-026**: Sign-in and denial states MUST meet WCAG 2.2 Level AA: labels, field-level errors that preserve valid input, keyboard operation, and visible focus (constitution IX).
- **FR-027**: Administration responses MUST remain non-indexable and MUST NOT appear in the public sitemap. This feature MUST NOT add Administration UI links to anonymous public pages (constitution I, VIII).
- **FR-028**: Versioned, machine-readable contracts for sign-in, session, and permission-denied outcomes MUST be published or updated before consumers change (constitution III). The existing administration sign-in contract is the starting point; it MAY be extended to include roles and permissions.
- **FR-029**: This feature MUST NOT add script or layout weight to public pages. Administration UI changes MUST reuse existing layout regions and design patterns (constitution II, VI, X, XI).
- **FR-030**: Quality gates MUST cover bootstrap idempotency, password sign-in success and generic failure, permission grant, permission denial (including a direct request), and contract validation (constitution XIII).

### Key Entities

- **Administrator (staff user)**: A provisioned staff identity (email, active flag, credential). Not a public visitor. Created by bootstrap or the operator provisioning path. Assigned one or more Roles.
- **Role**: A named set of Permissions (at minimum Administrator and Editor). Assigned to users; does not itself sign in.
- **Permission**: A named capability that corresponds to one existing administration action: view records, save drafts, or publish.
- **Role assignment**: The link between a staff user and a Role. A user’s effective permissions are the union of assigned roles.
- **Admin Session**: The signed-in period for one staff user. Required for administration. Carries enough authorisation context for the workspace to render allowed actions; enforcement still occurs on each protected request.
- **Bootstrap set**: The operator-supplied default users (at least two) plus the default roles created in an environment. Not a public record. Repeatable without duplication.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After one successful bootstrap, 100% of trial environments have at least two active users who can sign in, and both default roles (Administrator and Editor) exist with the documented permissions.
- **SC-002**: In a measured trial, a provisioned user completes sign-in with a correct password in under 30 seconds on a typical office connection, on 100% of first valid attempts.
- **SC-003**: 100% of failed sign-in attempts using a wrong password, an unknown email, or an inactive account produce the same generic outcome and create 0 sessions.
- **SC-004**: 0 sign-up, register, or self-service account-creation paths are present on the Administration UI or the public site (manual or automated check).
- **SC-005**: In 100% of trials, a user with publish permission can publish a placeholder record, and a user without publish permission cannot — including when they send the publish request directly. The public site changes only in the allowed case.
- **SC-006**: Repeating bootstrap with the same default identities creates 0 duplicate users and 0 duplicate default roles in 100% of trials.
- **SC-007**: 100% of unauthenticated requests to protected administration actions fail to expose staff-only content, roles, or permissions.
- **SC-008**: 100% of sign-in and permission-denied messages are referenced by message key (zero hard-coded user-facing strings in those flows).
- **SC-009**: 100% of sign-in and denial screens pass WCAG 2.2 AA automated checks with zero critical violations.

## Assumptions

- This feature extends `001-website-foundation`; it does not replace the Administration UI, the public static site, or the draft/publish path.
- Authentication remains staff-only. There are still no authenticated public visitor areas.
- Password sign-in continues the foundation’s confidential, server-backed session (idle and absolute timeouts, generic failure, no disclosure of account existence).
- The two default users are both staff accounts for the Administration UI. At least one is a full Administrator. If the operator does not specify otherwise, both receive the Administrator role so a single person is not the only fully authorised operator.
- The Editor role exists so RBAC is testable and so a later-provisioned (or operator-assigned) user can draft without publishing. This feature does not require a user-management screen to assign Editor.
- Additional users after bootstrap use the existing operator provisioning path, now including a role assignment. No Administration UI for user or role management in this phase.
- Password recovery, password change by the signed-in user, and SSO remain later work unless a later specification adds them.
- A user may hold more than one role; permissions combine as a union. A user with no permissions can be signed in but cannot complete protected mutations.
- Permission names stay aligned with today’s three administration actions. New content types later SHOULD reuse view / draft / publish rather than inventing a parallel catalogue.
- Bootstrap secrets are supplied by the operator per environment (local, preview, production). They are not committed as known defaults.
- Public SEO, Core Web Vitals, and static delivery baselines from the foundation remain unchanged; this feature only ensures administration stays private and non-indexable.
- WCAG 2.2 Level AA remains the accessibility target for sign-in and denial states.

## Constraints

- Specifications and implementations MUST remain aligned with the existing three-surface architecture (public frontend, backend, Administration UI). A fourth identity product is out of scope.
- Stack and library choices belong to `/speckit-plan`. This specification MUST stay technology-agnostic while naming the existing contracts and operator path as the extension points.
- Public pages MUST stay statically deliverable and MUST NOT require a staff session.
- Self-registration MUST NOT be added “for convenience” in any environment, including local.
- Least privilege: default Editor MUST NOT receive publish. Default passwords MUST NOT be embedded in the product.
- Weakening foundation security, accessibility, i18n, or administration-isolation baselines MUST require a documented, approved exception.
