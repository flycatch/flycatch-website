# Feature Specification: Administration Roles and Permissions

**Feature Branch**: `003-roles-permissions`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "In the Administration section, implement a complete Roles & Permissions feature. Clicking Settings should open the Roles page. Add New Role, Search, pagination with 5 roles per page. Table columns: Name, Description, Users, Actions (Edit, Delete). Connect the UI to the backend so roles are persisted. Use the same form for creating and editing a role (Role Name, Description, and per-page/content-type Create, Read, Update, Delete, Publish). When editing, load existing permissions. Save through the backend. Delete only after confirmation. Use existing architecture. Keep the implementation simple. Add clean and responsive styling. The browser tab name follows the selected section."

**Constitution alignment**: This specification implements mandatory governance from `.specify/memory/constitution.md` (v1.0.0). Requirements trace primarily to principles VIII (security), III (contract-first), V (i18n), IX (accessibility), II (native elements), VI (performance), XI (responsive UI), XII (production-grade), and XIII (quality gates). Public SEO/AEO (I) and Core Web Vitals (VII) apply only as a non-regression: this feature MUST NOT weaken public delivery or expose the Administration UI to search.

## Scope

This feature **adds** staff-facing role management to the existing Administration UI. It extends `002-auth-rbac`, which defined roles, permissions, bootstrap, and server-side enforcement but left role-management screens out of scope. It does not add public visitor accounts or a new product surface.

### In scope

- A Settings entry in Administration that opens a Roles page for authorised staff
- Listing persisted roles with search, pagination (five roles per page), and columns for name, description, assigned-user count, and actions
- Creating and editing a role with one shared form: role name, description, and a permission matrix of available application pages/content types with Create, Read, Update, Delete, and Publish
- Loading a role’s existing details and permissions when editing
- Persisting role details and permissions through the administration backend
- Deleting a role only after the staff member confirms
- Browser tab title that follows the selected Administration section
- Accessible, internationalised, responsive Roles screens consistent with Administration UI baselines
- Server-side enforcement of who may manage roles (hiding the Settings entry is not sufficient)

### Out of scope

- Public visitor accounts or any authenticated public area
- Creating, inviting, or assigning staff users from this screen (user provisioning stays on the existing operator path)
- Changing sign-in, sign-out, session lifetime, or bootstrap of the first two default users
- Per-record or per-field access lists, approval workflows, or legal-review products
- Enforcing Create and Delete on content records that the product does not yet allow staff to create or delete
- Changing public static delivery, publish mechanics, or content models beyond recording permissions against existing pages/content types

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authorised staff member opens Roles from Settings (Priority: P1)

A signed-in Administrator (or any staff member whose roles include role-management) opens Administration, selects Settings, and sees the Roles page. The browser tab title matches Settings. An Editor (or any staff member without role-management) does not see a working Settings entry for roles and cannot complete role-management actions.

**Why this priority**: Without a reachable, authorised Roles page, nothing else in this feature can be used.

**Independent Test**: Sign in as Administrator; open Settings; confirm the Roles list is shown and the tab title matches the section. Sign in as Editor; confirm Settings for roles is absent or clearly unusable and a direct role-management request is refused.

**Acceptance Scenarios**:

1. **Given** a signed-in staff member whose roles include role-management, **When** they select Settings, **Then** they see the Roles page and the browser tab title is the Settings section label
2. **Given** a signed-in staff member whose roles do not include role-management, **When** they use Administration, **Then** they do not get a working Settings control that opens Roles
3. **Given** that same unauthorised signed-in staff member, **When** a role-management request is sent anyway, **Then** the system refuses it, does not change roles, and leaves them signed in
4. **Given** an unauthenticated person, **When** they request role-management, **Then** they are treated as signed out (not as “permission denied”) and see no staff-only role data
5. **Given** a signed-in authorised staff member switching among Site settings, Home page, Settings, and add/edit role, **When** the selected section changes, **Then** the browser tab title follows that section’s label; sign-in keeps the sign-in title

---

### User Story 2 - Authorised staff member finds and reviews roles (Priority: P1)

The authorised staff member sees persisted roles in a table: Name, Description, Users (how many staff are assigned), and Actions. They can search and move through pages of five roles each. Default roles created by bootstrap appear alongside any later custom roles.

**Why this priority**: Staff cannot manage what they cannot find. Persistence is proven by listing what the backend already stores.

**Independent Test**: With more than five roles present, open Settings, confirm five per page and paging; search by name or description; confirm user counts and that listed data matches stored roles.

**Acceptance Scenarios**:

1. **Given** persisted roles exist, **When** an authorised staff member opens Settings, **Then** they see a Roles list with Name, Description, Users, and Actions
2. **Given** more than five roles, **When** they view the list, **Then** exactly five roles appear on the first page and they can move to further pages to see the rest
3. **Given** roles with distinct names or descriptions, **When** they search, **Then** the list is limited to matching roles and paging starts from the first page of that result
4. **Given** a role assigned to some number of staff, **When** the list is shown, **Then** the Users column shows that count
5. **Given** an Add New Role control, **When** the list is shown, **Then** that control is available to authorised staff

---

### User Story 3 - Authorised staff member creates or edits a role and its permissions (Priority: P1)

The authorised staff member uses one form to add a role or to edit an existing one. They enter a role name and description. They see each available application page/content type with Create, Read, Update, Delete, and Publish. On edit, the form shows the role’s current details and permissions. Saving stores name, description, and permissions so a later visit shows the same data.

**Why this priority**: Creating and editing with a persisted permission matrix is the core value of the feature.

**Independent Test**: Create a role with a subset of permissions; reopen it and confirm the same name, description, and checks; change permissions and confirm the stored set updates. Confirm the matrix lists current managed pages/content types.

**Acceptance Scenarios**:

1. **Given** the Roles list, **When** authorised staff choose Add New Role, **Then** they see the same form used for editing, empty of a stored role, with name, description, and the permission matrix
2. **Given** an existing role, **When** they choose Edit, **Then** the form loads that role’s name, description, and current permissions
3. **Given** the permission matrix, **When** it is shown, **Then** each available application page/content type has Create, Read, Update, Delete, and Publish
4. **Given** valid name and selected permissions, **When** they save, **Then** the role is persisted and a later list or edit shows the saved details and permissions
5. **Given** a role name that already exists (ignoring letter case), **When** they try to save a new role with that name, **Then** save is refused with a field-level, internationalised error and no duplicate role is created
6. **Given** a default system role (Administrator or Editor), **When** they edit it, **Then** they may change description and permissions but MUST NOT rename it

---

### User Story 4 - Authorised staff member deletes a role after confirmation (Priority: P2)

The authorised staff member chooses Delete on a role that is safe to remove. They must confirm before the role is removed. Default system roles cannot be deleted. A role still assigned to staff cannot be deleted until it has no assignees.

**Why this priority**: Accidental deletion of roles would lock staff out of work; confirmation and safeguards are required before delete is useful.

**Independent Test**: Attempt delete of a custom unused role: cancel leaves it; confirm removes it. Attempt delete of Administrator, Editor, or a role with assignees: deletion is refused.

**Acceptance Scenarios**:

1. **Given** a custom role with no assigned users, **When** authorised staff choose Delete, **Then** they are asked to confirm before anything is removed
2. **Given** that confirmation prompt, **When** they cancel, **Then** the role remains
3. **Given** that confirmation prompt, **When** they confirm, **Then** the role is removed and no longer appears in the list
4. **Given** a default system role (Administrator or Editor), **When** they attempt Delete, **Then** deletion is refused and the role remains
5. **Given** a role still assigned to one or more staff, **When** they attempt Delete, **Then** deletion is refused and the role remains

---

### Edge Cases

- Settings is selected but workspace content records cannot be loaded — authorised staff MUST still reach Roles; unauthorised staff MUST NOT
- Search matches no roles — the list is empty with an accessible, internationalised empty state; paging does not invent rows
- A role is edited by two staff at once — the last successful save is stored; a deleted role cannot be edited (not-found, internationalised)
- The last remaining role-management capability on Administrator MUST NOT be removable in a way that leaves the environment with nobody who can open Settings
- A staff member’s role-management access is revoked after they signed in — subsequent role-management actions MUST use current assignments
- Permission checkboxes for Create or Delete on a content type that staff cannot yet create or delete MAY be stored; they MUST NOT imply those content operations exist
- Direct requests to Administration addresses by crawlers MUST remain non-indexable and MUST NOT leak role names, descriptions, or permission grants in public HTML
- Failed role save MUST preserve valid input the person already entered

## Requirements *(mandatory)*

### Functional Requirements

#### Navigation and visibility

- **FR-001**: Administration MUST provide a Settings control, distinct from Site settings, that opens the Roles page for authorised staff.
- **FR-002**: The Settings control MUST be available only to signed-in staff whose current roles include role-management. Default Administrator MUST have role-management. Default Editor MUST NOT.
- **FR-003**: The browser tab title MUST follow the selected Administration section, using the same labels as the navigation (Site settings, Home page, Settings, Add New Role, Edit role). The sign-in screen MUST keep the sign-in title.
- **FR-004**: Role-management screens MUST remain on the existing Administration UI surface. They MUST reuse the existing staff session; they MUST NOT require a separate public application.

#### Roles list

- **FR-005**: The Roles page MUST list persisted roles with columns: Name, Description, Users (assigned staff count), and Actions (Edit, Delete).
- **FR-006**: The Roles page MUST provide Add New Role and Search (by name or description).
- **FR-007**: The Roles page MUST paginate at five roles per page.
- **FR-008**: The list MUST reflect stored roles, including bootstrap default roles and later custom roles.

#### Create and edit

- **FR-009**: Create and edit MUST use the same form with Role Name, Description, and a permission matrix.
- **FR-010**: The matrix MUST list available application pages/content types. For each, staff MUST be able to grant or withhold Create, Read, Update, Delete, and Publish.
- **FR-011**: When editing, the form MUST load the role’s existing name, description, and permissions.
- **FR-012**: Saving MUST persist role details and permissions through the administration backend so a later visit shows the same data.
- **FR-013**: Role names MUST be unique ignoring letter case. Description MAY be empty.
- **FR-014**: Default system roles Administrator and Editor MUST NOT be renamed. Their description and permissions MAY be edited, subject to FR-020.

#### Delete

- **FR-015**: Delete MUST run only after the staff member confirms. Cancelling MUST leave the role unchanged.
- **FR-016**: Default system roles MUST NOT be deletable.
- **FR-017**: A role with one or more assigned staff MUST NOT be deletable.

#### Authorisation and persistence

- **FR-018**: The backend MUST refuse role-management actions when the signed-in person lacks role-management. A hidden control is not sufficient.
- **FR-019**: Unauthenticated role-management requests MUST be rejected as unauthenticated, not as insufficient permission.
- **FR-020**: The Administrator role MUST retain role-management so the environment cannot be left with no one able to open Settings.
- **FR-021**: Effective permissions for existing view, draft, and publish administration actions MUST stay consistent with the matrix: granting Read MUST continue to allow viewing managed records; Update MUST continue to allow saving drafts; Publish MUST continue to allow publish. Create and Delete grants MAY be stored without adding new content create/delete operations in this feature.
- **FR-022**: Versioned, machine-readable contracts for listing, reading, creating, updating, and deleting roles, and for the permission catalogue, MUST be published or updated before consumers change (constitution III).

#### Non-functional (constitution)

- **FR-023**: User-facing strings for Roles, Settings, validation, confirmation, and denial MUST be externalised as message keys (constitution V).
- **FR-024**: Roles screens MUST meet WCAG 2.2 Level AA: labels, keyboard operation, visible focus, and field-level errors that preserve valid input (constitution IX).
- **FR-025**: Administration responses MUST remain non-indexable and MUST NOT appear in the public sitemap. This feature MUST NOT add Administration UI links to anonymous public pages (constitution I, VIII).
- **FR-026**: This feature MUST NOT add script or layout weight to public pages. Administration UI changes MUST reuse existing layout regions and design patterns and MUST be usable on supported viewports (constitution II, VI, X, XI).
- **FR-027**: Quality gates MUST cover authorised list/create/edit/delete, search and five-per-page paging, unauthorised refusal, system-role and in-use delete refusal, duplicate-name refusal, and contract validation (constitution XIII).

### Key Entities

- **Role**: A named set of permissions with an optional description. Assigned to staff; does not itself sign in. Includes bootstrap defaults Administrator and Editor and any later custom roles.
- **Permission grant**: A stored yes/no for one action (Create, Read, Update, Delete, Publish) on one application page or content type, plus role-management for who may use Settings.
- **Role assignment**: The link between a staff user and a Role. The Users column is the count of these links. Effective permissions remain the union of assigned roles (`002-auth-rbac`).
- **Permission catalogue**: The current list of application pages/content types that appear as matrix rows, derived from managed administration records (at minimum site settings and the home page).
- **Staff session**: The signed-in period required for Administration. Role-management uses current assignments at request time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of trials, an authorised Administrator reaches the Roles page from Settings in under 30 seconds after sign-in on a typical office connection, and the tab title matches Settings.
- **SC-002**: In 100% of trials, an Editor (or any user without role-management) cannot complete a role create, edit, or delete — including when they send the request directly.
- **SC-003**: Creating a role and reopening it shows the same name, description, and permission selections in 100% of trials.
- **SC-004**: With more than five stored roles, the first page shows exactly five rows in 100% of trials, and remaining roles are reachable by paging.
- **SC-005**: 100% of delete attempts without confirmation leave the role in place; 100% of confirmed deletes of a custom unused role remove it.
- **SC-006**: 100% of attempts to delete Administrator, Editor, or a role that still has assigned staff leave that role in place.
- **SC-007**: 100% of unauthenticated requests for role data fail to expose role names, descriptions, or permission grants.
- **SC-008**: 100% of Roles, Settings, validation, confirmation, and denial messages are referenced by message key (zero hard-coded user-facing strings in those flows).
- **SC-009**: 100% of Roles list, form, and confirmation screens pass WCAG 2.2 AA automated checks with zero critical violations, and remain usable at a typical mobile and desktop administration viewport.

## Assumptions

- This feature extends `002-auth-rbac` and `001-website-foundation`. It does not replace sign-in, bootstrap of the first two users, draft/publish, or the public static site.
- “Settings” is the Administration navigation label that opens Roles. It is not Site settings.
- Role-management is a staff capability held by default Administrator and not by default Editor. Custom roles do not receive role-management unless a later specification says they may.
- Available matrix rows are the managed pages/content types already administered today (site settings and home at minimum). New managed pages SHOULD appear as additional rows without a new product surface.
- Create and Delete in the matrix are recorded for completeness. This feature does not add staff operations to create or delete content records.
- Read, Update, and Publish in the matrix continue to mean view managed records, save drafts, and publish, as in `002-auth-rbac`.
- Staff user assignment to roles remains an operator provisioning concern. This screen only displays how many users hold each role.
- Public SEO, Core Web Vitals, and static delivery baselines remain unchanged.
- WCAG 2.2 Level AA remains the accessibility target for Roles screens.

## Constraints

- Specifications and implementations MUST remain aligned with the existing three-surface architecture (public frontend, backend, Administration UI). A fourth identity or roles product is out of scope.
- Stack and library choices belong to `/speckit-plan`. This specification MUST stay technology-agnostic while naming the existing Administration UI, staff session, and administration contracts as the extension points.
- Public pages MUST stay statically deliverable and MUST NOT require a staff session.
- Least privilege: default Editor MUST NOT receive role-management. Default Administrator MUST NOT lose role-management through this screen.
- Weakening foundation or `002-auth-rbac` security, accessibility, i18n, or administration-isolation baselines MUST require a documented, approved exception.
