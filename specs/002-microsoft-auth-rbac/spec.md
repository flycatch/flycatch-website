# Feature Specification: Microsoft Authentication with RBAC

**Feature Branch**: `002-microsoft-auth-rbac`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Implement Microsoft authentication with RBAC"

**Constitution alignment**: This specification implements mandatory governance from `.specify/memory/constitution.md` (v1.0.0). Requirements trace to principles III (contract-first), V (i18n), VI (performance), VIII (security), IX (accessibility), X (design consistency), XI (responsive UI), XII (production-grade), and XIII (quality gates). Principles I (SEO/AEO) and VII (Core Web Vitals) apply as non-regression: the public site MUST remain statically delivered, indexable only where already specified, and free of administration or sign-in scripts. Principle II (native elements) applies to sign-in and permission-denied surfaces.

## Scope

This feature replaces password-based Administration UI sign-in with **Microsoft work-account sign-in** and introduces **role-based access control** so staff only perform actions their role allows.

It extends the Website Foundation (`001-website-foundation`) Administration UI. It does **not** add public visitor login or change how published pages are delivered to visitors and crawlers.

### In scope

- Sign-in to the Administration UI using a Microsoft work or school account from the organisation’s Microsoft directory
- Sign-out that ends the administration session
- Three application roles — **Viewer**, **Editor**, **Administrator** — enforced on every administration action
- Operator bootstrap of the first Administrator and in-product role assignment by Administrators
- Denial of access for people who are not assigned a role, whose Microsoft account is no longer valid, or whose role does not permit the requested action
- Retirement of password-based administration sign-in
- Accessible, localised sign-in, session-ended, and permission-denied experiences
- Versioned contracts for Microsoft sign-in, session, and authorisation before consumer work
- Continued exclusion of the Administration UI (including the Microsoft sign-in surface) from public search

### Out of scope

- Public visitor accounts, client portals, or Microsoft sign-in on the public site
- Personal Microsoft accounts (consumer identities) as a way to reach administration
- Self-registration or a public “request access” form
- Additional workflow products (legal review queues, scheduled campaigns, approval chains beyond draft vs publish)
- Fine-grained permissions beyond the three roles defined here (for example per-page ownership)
- Multi-directory / multi-organisation Microsoft tenancy
- Password recovery, local password login as a fallback, or “break-glass” local accounts (operators use Microsoft assignment to restore access)
- Full audit-product features beyond the foundation’s existing attribution of who changed a record

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Staff member signs in with Microsoft (Priority: P1)

An authorised staff member opens the Administration UI, chooses to sign in with Microsoft, completes their organisation’s Microsoft sign-in (including any multi-factor step their organisation already requires), and lands in the administration workspace. They see only navigation and actions allowed for their role. They never type a site-specific password.

**Why this priority**: Without Microsoft sign-in, this feature delivers no value. It is the replacement for today’s password-based administrator access.

**Independent Test**: Using a Microsoft work account that has been assigned an application role, complete sign-in and confirm the workspace appears; using a Microsoft work account with no role, confirm the workspace never appears.

**Acceptance Scenarios**:

1. **Given** a Microsoft work account that an operator or Administrator has assigned a role, **When** the person completes Microsoft sign-in, **Then** they reach the Administration UI workspace and see their current role reflected in what they can do
2. **Given** an unauthenticated person, **When** they request an administration address, **Then** they do not see staff-only or unpublished content and are offered Microsoft sign-in
3. **Given** a Microsoft work account that has no application role, **When** that person completes Microsoft sign-in, **Then** they do not receive an administration session and do not see administration content
4. **Given** a person who is not using a Microsoft work or school account from the organisation’s directory, **When** they attempt to sign in, **Then** they are denied and the Administration UI remains inaccessible
5. **Given** a successful Microsoft sign-in, **When** the person returns to an administration address in the same browser before the session ends, **Then** they remain signed in without repeating Microsoft sign-in

---

### User Story 2 - Roles limit what staff can change (Priority: P1)

A signed-in staff member tries to view records, save a draft, or publish. The system allows only the actions their role permits. The public site still shows only published content. A Viewer cannot change records. An Editor can save drafts but cannot publish. An Administrator can draft and publish.

**Why this priority**: Authentication without authorisation would leave every signed-in person with full publish power, which is the risk this feature exists to remove.

**Independent Test**: Sign in as each of the three roles and confirm view, draft, and publish succeed or fail exactly as the role matrix specifies, including when the person attempts a disallowed action directly (not only through hidden buttons).

**Acceptance Scenarios**:

1. **Given** a signed-in Viewer, **When** they open the administration workspace, **Then** they can read administration records and **cannot** save a draft, publish, or change anyone’s role
2. **Given** a signed-in Editor, **When** they edit a record and save as draft, **Then** the draft is stored and the public site still shows the last published version
3. **Given** a signed-in Editor, **When** they attempt to publish, **Then** the publish does not occur and they are told they do not have permission
4. **Given** a signed-in Administrator, **When** they save a draft and publish, **Then** the public site reflects the published version after the documented publish path completes
5. **Given** any signed-in role, **When** they request an action their role does not allow (including by submitting the action without using the usual control), **Then** the system refuses the action and does not change the record

---

### User Story 3 - Administrator assigns and changes roles (Priority: P2)

An Administrator (or, for the first person, an authorised operator) grants a Microsoft work identity a role, changes that role, or removes access. The affected person can use the Administration UI only after they have a role, and they lose access when the role is removed.

**Why this priority**: Roles must be assignable or the organisation cannot onboard or offboard staff. First-Administrator bootstrap is required so the product is usable after password sign-in is retired.

**Independent Test**: Bootstrap one Administrator, assign Viewer and Editor to two other Microsoft work identities, change one role, revoke another, and confirm each person’s next administration attempt matches the new assignment.

**Acceptance Scenarios**:

1. **Given** no Administrator exists yet, **When** an authorised operator assigns the Administrator role to a Microsoft work identity, **Then** that person can complete Microsoft sign-in and use Administrator capabilities
2. **Given** a signed-in Administrator, **When** they assign Viewer or Editor to another Microsoft work identity, **Then** that person can sign in and is limited to the assigned role
3. **Given** a signed-in Administrator, **When** they change a person’s role, **Then** that person’s subsequent actions follow the new role (including if they are already signed in)
4. **Given** a signed-in Administrator, **When** they remove a person’s role, **Then** that person can no longer use the Administration UI
5. **Given** a Viewer or Editor, **When** they attempt to assign or change roles, **Then** the change is refused
6. **Given** an Administrator, **When** they view who has access, **Then** they can see each person’s Microsoft work identity and current role without seeing secrets or Microsoft passwords

---

### User Story 4 - Staff member signs out and password sign-in is gone (Priority: P2)

A signed-in staff member signs out and can no longer use administration until they sign in with Microsoft again. Anyone who still has an old site-specific password cannot use it. Existing administration sessions created under password sign-in are no longer valid once this feature is in effect.

**Why this priority**: Leaving password sign-in in place would keep the weaker path the foundation already treated as temporary. Sign-out must remain reliable after the identity provider changes.

**Independent Test**: Sign in with Microsoft, sign out, confirm administration content is gone; attempt the former password sign-in path and confirm it cannot create a session.

**Acceptance Scenarios**:

1. **Given** a signed-in staff member, **When** they sign out, **Then** subsequent requests to administration addresses do not show administration content
2. **Given** a person who only knows a former administration password, **When** they try to sign in with that password, **Then** they cannot obtain an administration session
3. **Given** a session that existed before Microsoft sign-in took effect, **When** that session is presented, **Then** it is treated as signed out
4. **Given** a staff member whose Microsoft session at Microsoft has ended or whose work account is disabled, **When** they next need a new administration session, **Then** they cannot enter the Administration UI

---

### User Story 5 - Denied and failed access stay clear and private (Priority: P3)

People who are not allowed in, whose session has ended, or who lack permission for one action receive a clear, accessible explanation. Those messages do not reveal whether other staff accounts exist, what roles other people hold, or unpublished content. The sign-in and denial surfaces remain usable on small screens and with a keyboard.

**Why this priority**: Security failures often come from leaky errors; accessibility failures would block staff from the only remaining way to sign in.

**Independent Test**: Trigger unauthenticated access, unassigned Microsoft account, expired session, and a forbidden publish as an Editor; confirm each message is understandable, keyboard-reachable, and does not expose staff-only data.

**Acceptance Scenarios**:

1. **Given** an unassigned Microsoft work account, **When** sign-in is attempted, **Then** the person sees a generic “you do not have access” outcome and no administration records
2. **Given** an idle or expired administration session, **When** the person continues working, **Then** they are treated as signed out, unsaved edits do not publish themselves, and they can start Microsoft sign-in again
3. **Given** a forbidden action, **When** the person is told they lack permission, **Then** the message names the denied action in plain language and does not list other people’s roles or identities
4. **Given** the Microsoft sign-in and permission-denied surfaces, **When** a staff member uses only a keyboard on a mobile-width viewport, **Then** they can complete or dismiss the journey without losing context of valid input they already entered

---

### Edge Cases

- Microsoft sign-in is cancelled or fails at Microsoft — the person remains signed out; no administration session is created
- Microsoft sign-in succeeds but the work account has no assigned role — no administration session; generic access-denied outcome
- Microsoft sign-in succeeds with a personal (consumer) Microsoft account — access is denied
- A person’s role is changed or removed while they are signed in — the next action uses the new assignment; if they have no role, they lose administration access immediately
- A Microsoft work account is disabled, deleted, or blocked by the organisation — new administration sessions MUST NOT be created; an existing administration session MUST NOT keep granting access after the system next checks that the account is still valid
- Two people share knowledge of a former site password — that password MUST NOT open administration
- An Editor or Viewer tampers with a request to publish or to change roles — the backend MUST refuse; hiding a control in the UI is not sufficient
- Session idle timeout or absolute lifetime is reached — treat as signed out; do not auto-publish
- Concurrent sessions: signing out in one browser MUST end that session; it MUST NOT silently publish drafts from another session
- Direct requests to Administration UI or Microsoft sign-in addresses by crawlers or anonymous visitors — responses MUST remain non-indexable and MUST NOT leak staff-only data
- Public pages MUST NOT gain Microsoft sign-in scripts, buttons, or links intended for staff
- Locale copy for sign-in, role names, and denial messages is hard-coded — quality gates MUST fail until strings are externalised
- The first Administrator has not been assigned — no staff member can complete administration sign-in until an operator completes bootstrap
- An Administrator attempts to remove their own last remaining Administrator role when they are the only Administrator — the system MUST refuse so the organisation is not locked out (an operator can still change assignments out of band)

## Requirements *(mandatory)*

### Functional Requirements

#### Microsoft sign-in (Administration UI only)

- **FR-001**: Staff MUST sign in to the Administration UI using a Microsoft work or school account from the organisation’s configured Microsoft directory. Site-specific passwords MUST NOT be accepted.
- **FR-002**: Only identities that have an assigned application role MUST receive an administration session after Microsoft sign-in succeeds.
- **FR-003**: Unauthenticated requests to administration addresses MUST NOT reveal staff-only content or unpublished records and MUST offer Microsoft sign-in rather than a password form.
- **FR-004**: Sign-out MUST end the administration session. After sign-out, administration content MUST NOT remain usable from the same browser without signing in with Microsoft again.
- **FR-005**: Administration sessions MUST remain server-backed, with idle timeout, a maximum lifetime, and protection so a request forged on another site cannot change administration data (same policy intent as foundation FR-045).
- **FR-006**: Session secrets MUST NOT appear in public HTML, logs, or client-side storage that is not required for the session to function.
- **FR-007**: Failed or cancelled Microsoft sign-in, and sign-in by an identity with no role, MUST NOT disclose whether other staff identities exist or what roles they hold.
- **FR-008**: Personal Microsoft accounts and accounts outside the organisation’s directory MUST be rejected for administration access.
- **FR-009**: When a Microsoft work account is no longer valid in the organisation’s directory, the system MUST refuse new administration sessions and MUST refuse further administration actions the next time that person’s existing session is used.
- **FR-010**: Password-based administration sign-in MUST be removed. Sessions created under password sign-in MUST be invalid once this feature is in effect.
- **FR-011**: There MUST be no public self-registration and no public visitor Microsoft sign-in.

#### Role-based access control

- **FR-012**: Every administration action MUST be authorised against the signed-in person’s current application role. Enforcement MUST occur on the server, not only by hiding controls.
- **FR-013**: The system MUST support exactly these roles and permissions:

  | Role            | View administration records | Save drafts | Publish | Assign or change roles |
  | --------------- | --------------------------- | ----------- | ------- | ---------------------- |
  | Viewer          | Yes                         | No          | No      | No                     |
  | Editor          | Yes                         | Yes         | No      | No                     |
  | Administrator   | Yes                         | Yes         | Yes     | Yes                    |

- **FR-014**: A person MUST hold at most one application role at a time.
- **FR-015**: Role checks MUST use the assignment at the time of the action. A change or removal MUST apply to the next action without requiring a full Microsoft sign-in again, except that removal of all access MUST end administration use immediately.
- **FR-016**: Denied actions MUST NOT be performed and MUST return a clear, localised permission-denied outcome that does not list other people’s identities or roles.
- **FR-017**: Publish MUST continue to follow the foundation publish path: drafts MUST NOT appear on the public static site until an Administrator publishes.
- **FR-018**: Changes to managed records MUST remain attributable to the signed-in Microsoft identity (who changed what, at what time), consistent with foundation FR-054.

#### Role assignment and bootstrap

- **FR-019**: An authorised operator MUST be able to assign the first Administrator role to a Microsoft work identity without using the Administration UI (bootstrap). Until that assignment exists, nobody can complete administration sign-in.
- **FR-020**: A signed-in Administrator MUST be able to assign Viewer, Editor, or Administrator to a Microsoft work identity, change that role, and remove access.
- **FR-021**: Viewers and Editors MUST NOT assign, change, or remove roles.
- **FR-022**: The system MUST refuse an action that would leave the organisation with zero Administrators (the last Administrator cannot remove or demote themselves).
- **FR-023**: Role assignment MUST identify people by their Microsoft work identity (stable organisational account), not by a site-specific password.
- **FR-024**: Administrators MUST be able to see who currently has access and which role each person holds.

#### Contracts, isolation, and quality

- **FR-025**: Versioned, machine-readable contracts MUST be published before consumer implementation for Microsoft sign-in, session, role assignment, and authorisation-denied outcomes. Administration UI and backend MUST consume those contracts; they MUST NOT invent a parallel private interface.
- **FR-026**: Automated quality gates MUST reject invalid or incomplete contract changes and MUST cover Microsoft sign-in, role-allowed paths, role-denied paths, sign-out, and retirement of password sign-in.
- **FR-027**: Administration UI addresses, including the Microsoft sign-in surface, MUST remain absent from the public sitemap, non-indexable, and free of staff-only data in responses meant for anonymous visitors or crawlers.
- **FR-028**: Public pages MUST NOT include Microsoft sign-in controls, staff-only links, or added script weight for this feature. Public Core Web Vitals and page-weight budgets MUST NOT regress.
- **FR-029**: All user-facing strings introduced by this feature (sign-in, sign-out, role names, permission denied, bootstrap/operator messages shown in the product) MUST be externalised as message keys.
- **FR-030**: Sign-in, role management, and permission-denied surfaces MUST meet WCAG 2.2 Level AA, remain keyboard-operable, and remain usable across mobile, tablet, desktop, and large-screen viewports.
- **FR-031**: Those surfaces MUST reuse Administration UI layout regions and design tokens; they MUST NOT introduce a one-off visual language.
- **FR-032**: Secrets used to talk to Microsoft (application credentials, directory configuration) MUST be server-only and MUST NOT appear in client-delivered HTML, scripts, or assets.
- **FR-033**: This feature MUST NOT weaken foundation security, accessibility, i18n, administration isolation, or static public delivery. Any exception MUST be documented and approved before implementation proceeds.

### Key Entities

- **Microsoft Work Identity**: A staff person as known to the organisation’s Microsoft directory (work or school account). This is the only identity that may be granted administration access. Not a public visitor and not a personal Microsoft account.
- **Staff Member**: A Microsoft Work Identity that has been assigned an application role. Replaces the foundation’s password-provisioned Administrator as the signed-in actor.
- **Application Role**: One of Viewer, Editor, or Administrator. Determines which administration actions are allowed. A Staff Member has exactly one Application Role.
- **Role Assignment**: The binding of a Microsoft Work Identity to an Application Role, created by an operator (bootstrap) or by an Administrator. Removing the assignment removes access.
- **Admin Session**: The signed-in period for a Staff Member after successful Microsoft sign-in and role assignment. Idle timeout, maximum lifetime, and sign-out still apply. Invalid if the person no longer has a role or a valid Microsoft work account.
- **Permission Denial**: A user-visible, localised outcome when a signed-in person requests an action their role does not allow. Does not perform the action.
- **Managed Record**: Unchanged from the foundation: a content or settings item with draft and published states. Only Administrators may publish; Editors may draft; Viewers may only read.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a measured trial, 100% of staff with an assigned role can complete Microsoft sign-in and reach the administration workspace in under two minutes (excluding time spent on the organisation’s own Microsoft multi-factor prompts).
- **SC-002**: 100% of attempted administration actions that the signed-in role does not allow are refused and leave data unchanged (verified for Viewer, Editor, and Administrator, including actions submitted without using the usual control).
- **SC-003**: 0% of password-based sign-in attempts create an administration session after this feature is in effect.
- **SC-004**: 100% of Microsoft sign-in attempts by personal Microsoft accounts, accounts outside the organisation’s directory, work accounts with no role, or work accounts that are no longer valid fail to expose staff-only or unpublished content.
- **SC-005**: After sign-out, idle timeout, or role removal, 100% of subsequent administration requests in that browser fail to expose administration content until a new authorised Microsoft sign-in succeeds.
- **SC-006**: An authorised operator can bootstrap the first Administrator, and that Administrator can assign a second person a different role, in under ten minutes in a measured trial.
- **SC-007**: 100% of new user-facing strings for this feature are referenced by message key (zero hard-coded copy on sign-in, denial, and role-management surfaces).
- **SC-008**: 100% of Microsoft sign-in, permission-denied, and role-assignment screens pass WCAG 2.2 AA automated checks with zero critical violations and remain completable by keyboard on a mobile-width viewport.
- **SC-009**: 0% of Administration UI or Microsoft sign-in addresses appear in the public sitemap; public foundation pages show no Microsoft sign-in controls and no added staff-only script.
- **SC-010**: 100% of sign-in, session, role-assignment, and authorisation-denied boundaries have a published machine-readable contract before the first consumer implementation is merged.

## Assumptions

- This feature applies only to the Administration UI. The public site remains unauthenticated, as in the foundation.
- “Microsoft authentication” means organisational Microsoft work or school accounts in a single company directory, not personal Microsoft accounts and not multiple companies’ directories.
- The organisation already issues Microsoft work accounts and can require multi-factor authentication on the Microsoft side. This product does not replace the organisation’s Microsoft sign-in experience; it relies on it.
- Password-based administrator accounts from the foundation are retired, not run in parallel. Existing staff are granted access by assigning roles to their Microsoft work identities.
- Three roles (Viewer, Editor, Administrator) are sufficient for this phase. Finer permissions can be specified later without changing Microsoft sign-in.
- Role assignment is managed in this product (operator bootstrap + Administrator actions), not by asking staff to pick a role at sign-in. Microsoft directory group mapping may be added in a later specification if the organisation wants IT to drive roles only from Microsoft.
- Session idle timeout (30 minutes) and absolute lifetime (12 hours) from the foundation remain appropriate unless a later specification changes them.
- Administration usage remains a small number of internal staff, not a public-scale identity product.
- Hosting and Microsoft directory application registration details belong to planning, not this specification.
- WCAG 2.2 Level AA remains the accessibility target. Public Core Web Vitals targets are unchanged and are treated as a non-regression constraint.
- Attribution continues to record which Staff Member changed a Managed Record; a separate audit log product is still out of scope.

## Constraints

- Specifications and implementations MUST remain technology-agnostic at this stage; how Microsoft sign-in is integrated and which libraries are used belong to `/speckit-plan`.
- Public pages MUST stay statically deliverable. This feature MUST NOT require a live identity service for ordinary public browsing.
- The Administration UI and its Microsoft sign-in surface MUST NOT be indexed as marketing content.
- Least privilege is mandatory: a successful Microsoft sign-in is not enough; a role assignment is required.
- Server-only Microsoft credentials and directory configuration MUST never ship to browsers.
- Third-party sign-in MUST be justified against native capabilities, performance budgets, and production-grade operations (constitution principles II, VI, VIII, XII) during planning.
- Weakening foundation SEO, accessibility, performance, security, i18n, or administration isolation baselines MUST require a documented, approved exception before implementation proceeds.
