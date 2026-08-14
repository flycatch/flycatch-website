# Feature Specification: Website Foundation

**Feature Branch**: `001-website-foundation`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Establish the project foundation for a static, SEO-friendly website with a frontend and backend. keep the foundation production-ready, scalable, maintainable, and SEO-first." Follow-up: include an Administration UI in this same foundation (not only frontend and backend).

**Constitution alignment**: This specification implements mandatory governance from `.specify/memory/constitution.md` (v1.0.0). Requirements trace to principles I (SEO/AEO), II (native elements), III (contract-first), IV (conventional commits), V (i18n), VI (performance), VII (Core Web Vitals), VIII (security), IX (accessibility), X (design consistency), XI (responsive UI), XII (production-grade), and XIII (quality gates).

## Scope

The foundation defines **three bounded surfaces**:

1. **Public frontend** — statically delivered, SEO-first pages for visitors and crawlers
2. **Backend** — contract-first integration and data boundaries consumed by the public site and by administration
3. **Administration UI** — a separate, authenticated, non-indexable workspace for staff to manage content and site settings that feed the public site

### In scope

- Static delivery model for public pages (pre-rendered HTML, progressive enhancement, documented build-time vs runtime boundary)
- Distinct public frontend, backend, and Administration UI layers
- Backend contracts for public content binding and for administration operations (including sign-in, content/settings management, and publish)
- SEO-first metadata, crawlability, indexability, and answer-oriented template structure on the **public** site; explicit exclusion of the Administration UI from search
- Administration UI foundation: sign-in/sign-out, authorised access, layout regions, draft vs published, and quality baselines
- Production-ready baselines: performance, accessibility, internationalisation readiness, security, testing, environments, and maintainability
- Governance so later features inherit and cannot silently weaken these baselines

### Out of scope (deferred to later specifications)

- Page information architecture, navigation labels, and sitemap of marketing sections
- Content models, company copy, imagery, and populated structured data facts
- Live public form, newsletter, or analytics vendor integrations (contracts in this phase; administration of those integrations is later)
- Selection of hosting, CRM, email, analytics, or identity vendors
- Visual brand identity (exact colours, logos, typefaces) beyond reusable layout regions and token placeholders
- Public authenticated areas (client portals, customer login), e-commerce, or transactional commerce
- Multi-role workflow products (legal review, scheduled campaigns, media DAM) beyond a simple draft/publish path
- Self-service staff registration; administrators are provisioned by an authorised operator

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor receives crawlable static content (Priority: P1)

A first-time visitor (or a search crawler) requests a foundation page and receives complete, readable HTML with a clear heading structure, page identity, and metadata. The page is usable without waiting for extra client-side work, and the first meaningful content appears quickly.

**Why this priority**: Static, SEO-first delivery is the core of this foundation. If visitors and crawlers do not receive complete HTML, later pages cannot be discoverable or production-ready.

**Independent Test**: Audit a foundation page template for complete HTML delivery, unique metadata, semantic headings, and indexability without requiring the Administration UI to be open.

**Acceptance Scenarios**:

1. **Given** a foundation page template is published, **When** a visitor or crawler requests it, **Then** they receive complete HTML that includes a unique title, description, canonical address, and a single primary heading
2. **Given** client-side scripting is unavailable, **When** a visitor views a foundation template, **Then** they can still read the page content and follow internal links
3. **Given** a representative foundation page on a typical connection, **When** first meaningful content is measured at the 75th percentile, **Then** it meets the documented Core Web Vitals targets

---

### User Story 2 - Developer scaffolds a new route (Priority: P1)

A developer adds a placeholder route using documented frontend conventions (layout regions, metadata helpers, naming, and quality gates). The new route inherits SEO, accessibility, and performance baselines without one-off exceptions.

**Why this priority**: Maintainability and scalability depend on a repeatable path for new pages. If the first extra route requires special cases, the foundation has failed.

**Independent Test**: Add a placeholder public route that follows foundation conventions and confirm quality gates (build, accessibility, SEO metadata, contracts) still pass.

**Acceptance Scenarios**:

1. **Given** documented project conventions, **When** a developer adds a new placeholder public route, **Then** they can determine layout regions, metadata fields, and naming from documentation without inventing a parallel structure
2. **Given** the new route is included in the build, **When** quality gates run, **Then** the route fails the gates if required metadata, heading hierarchy, or accessibility baselines are missing
3. **Given** the new route meets conventions, **When** it is promoted through preview to production, **Then** it is delivered as static HTML consistent with existing foundation routes

---

### User Story 3 - Search engines discover public structure and skip administration (Priority: P2)

A search engine or answer engine discovers **public** foundation routes through a sitemap, robots rules, canonical addresses, and internal links. Indexable pages are not orphaned. The Administration UI is treated as a private surface: not listed in the public sitemap and not offered for indexing.

**Why this priority**: SEO-first means discoverability is designed in for the public site, and leakage of administration URLs into search would be a security and reputation failure.

**Independent Test**: Simulate a crawl of public foundation routes and verify every indexable template appears in the sitemap; confirm administration URLs are absent from the sitemap and marked non-indexable.

**Acceptance Scenarios**:

1. **Given** foundation routes are published, **When** the sitemap is inspected, **Then** every indexable **public** foundation route is listed and every listed route resolves successfully
2. **Given** robots and indexability rules are published, **When** a crawler reads them, **Then** it can distinguish indexable public pages from the Administration UI and other surfaces that must not be indexed
3. **Given** an indexable public foundation route, **When** a visitor arrives from another public foundation page, **Then** they can reach it through an internal link (no orphan indexable pages)
4. **Given** Administration UI addresses exist, **When** a crawler or unauthenticated visitor treats them as public landing pages, **Then** they are not in the public sitemap, are non-indexable, and do not expose administration content

---

### User Story 4 - Administrator signs in and uses the Administration UI (Priority: P2)

An authorised staff member signs in to the Administration UI, reaches a documented workspace with layout regions for future management tasks, can edit a placeholder content or site-settings record, save a draft, and publish. Unpublished changes do not appear on the public static site. Sign-out ends access.

**Why this priority**: Frontend and backend alone cannot keep a static site maintainable. Staff need a dedicated, secure workspace so content and settings are not edited by changing production files ad hoc.

**Independent Test**: Sign in as a provisioned administrator, complete a draft-and-publish path on a placeholder record, confirm the public page updates only after publish, then sign out and verify administration is no longer accessible.

**Acceptance Scenarios**:

1. **Given** a provisioned administrator and a valid sign-in, **When** they submit correct credentials, **Then** they reach the Administration UI workspace and see authorised navigation regions
2. **Given** an unauthenticated person, **When** they request an administration address, **Then** they do not see administration content and are directed to sign in
3. **Given** a signed-in administrator, **When** they edit a placeholder record and save as draft, **Then** the public static site still shows the last published version (not the draft)
4. **Given** a signed-in administrator, **When** they publish that record, **Then** the public static site reflects the published version after the documented publish path completes
5. **Given** a signed-in administrator, **When** they sign out, **Then** subsequent requests to administration addresses do not show administration content

---

### User Story 5 - Integration author defines a backend contract (Priority: P3)

An integration author publishes a versioned, machine-readable contract for a backend capability used by the public site and/or the Administration UI (for example content shape, site settings, sign-in, or publish). Quality gates validate the contract. Public pages still render as static HTML without the Administration UI being in use.

**Why this priority**: Contract-first separation lets public frontend, Administration UI, and backend evolve independently without silent coupling.

**Independent Test**: Publish a stub contract for one public and one administration boundary and confirm automated quality gates validate them; confirm public pages still build as static HTML.

**Acceptance Scenarios**:

1. **Given** a new integration boundary is proposed, **When** work on a consumer (public frontend or Administration UI) starts, **Then** a published machine-readable contract already exists for that boundary
2. **Given** a contract file is invalid or incomplete, **When** quality gates run, **Then** the change is rejected before promotion
3. **Given** public foundation templates are built, **When** the Administration UI is not in use, **Then** public pages still render fully as static HTML

---

### Edge Cases

- A public route is added without unique title, description, or canonical address — quality gates MUST fail and the route MUST NOT be promoted
- A page is marked non-indexable — it MUST be excluded from the public sitemap and covered by robots/canonical rules so it is not treated as a public landing page
- Client-side scripting fails or is blocked on the **public** site — essential content and navigation on public foundation templates MUST remain available
- A contract changes in a breaking way — the versioned contract MUST make the break visible; consumers MUST NOT silently assume the old shape
- A secret or server-only value is placed in client-delivered public or administration assets — quality review MUST reject the change
- A third-party script is added without a documented justification against performance budgets — it MUST NOT ship on public foundation templates
- Locale-specific copy is hard-coded in a public or administration template — quality gates MUST fail until the string is externalised
- Preview and production builds of the same revision MUST produce equivalent **public** HTML for foundation routes; drift MUST block promotion
- Invalid or unknown credentials — the Administration UI MUST deny access, MUST NOT reveal whether the account exists, and MUST NOT create a session
- Session expiry or idle timeout — the administrator MUST be treated as signed out; unsaved edits MUST NOT publish themselves
- A signed-in administrator with no permission for a given action — the UI MUST deny the action and MUST NOT perform it on the backend
- Draft or unpublished content requested as a public URL — the public site MUST NOT expose that draft as an indexable page
- Direct requests to Administration UI addresses by crawlers — responses MUST remain non-indexable and MUST NOT leak staff-only data in public HTML

## Requirements *(mandatory)*

### Functional Requirements

#### Static delivery (public frontend)

- **FR-001**: Public foundation pages MUST be delivered as complete, pre-rendered HTML so visitors and crawlers receive meaningful content without depending on client-side rendering.
- **FR-002**: Essential journeys on public foundation templates (reading content, following internal links) MUST remain usable when client-side scripting is unavailable.
- **FR-003**: The boundary between build-time generation and any runtime behaviour MUST be documented: ordinary public browsing MUST NOT require a live server; Administration UI and publish paths MAY require backend services behind contracts.
- **FR-004**: Public static assets MUST be cacheable in production and MUST be invalidated when a new published revision is deployed.

#### Three-surface separation (frontend, backend, Administration UI)

- **FR-005**: Public presentation, Administration UI, and backend/integration concerns MUST be distinct bounded layers with documented interfaces between them.
- **FR-006**: Neither the public presentation layer nor the Administration UI MUST embed vendor-specific integration details; each MAY consume only documented interfaces.
- **FR-007**: Content binding for public templates MUST use documented interfaces (not ad-hoc coupling to a particular backend or undocumented file layout).
- **FR-008**: Cross-cutting helpers for metadata, locale-aware copy, and internal links MUST be centralised so public pages and administration screens do not duplicate divergent implementations.
- **FR-009**: Public browsing MUST NOT require a running backend service. The Administration UI MAY require backend services, but only through published contracts.

#### SEO and AEO foundation (public site)

- **FR-010**: Every indexable **public** page MUST expose a unique title, meta description, and canonical address appropriate to that page.
- **FR-011**: Every public foundation template MUST use a logical heading hierarchy with exactly one primary heading and correctly nested subheadings.
- **FR-012**: Indexable public templates MUST include basic social-preview metadata (title, description, and image slot) so shares do not fall back to untitled pages.
- **FR-013**: An XML sitemap MUST list every indexable public foundation route, and every listed route MUST resolve successfully. Administration UI addresses MUST NOT appear in this sitemap.
- **FR-014**: Robots conventions MUST declare which **public** surfaces may be crawled and indexed and MUST exclude the Administration UI from indexing.
- **FR-015**: Structured-data templates MUST exist for organisation, web page, and FAQ-shaped **public** content without inventing unverified company facts.
- **FR-016**: URL stability rules MUST define canonicalisation and redirects for moved or duplicate **public** paths so later IA changes do not create competing URLs.
- **FR-017**: Internal linking conventions MUST ensure every indexable public foundation route is reachable from another published public page (no orphan indexable pages). Public pages MUST NOT expose Administration UI links to anonymous visitors.
- **FR-018**: Public foundation templates MUST reserve a concise, extractable summary region suitable for search snippets and answer-engine retrieval, separate from longer body content.

#### Performance and Core Web Vitals

- **FR-019**: Documented budgets MUST exist for public page weight, script weight, and third-party scripts; adding weight MUST be justified against user value.
- **FR-020**: Representative **public** foundation pages MUST meet Core Web Vitals “Good” thresholds at the 75th percentile: Largest Contentful Paint at or under 2.5 seconds, Interaction to Next Paint at or under 200 milliseconds, and Cumulative Layout Shift at or under 0.1.
- **FR-021**: Images and fonts on public pages MUST follow loading conventions that protect Largest Contentful Paint and Cumulative Layout Shift (reserved space, no unannounced late layout shifts).
- **FR-022**: Third-party scripts MUST NOT ship on public foundation templates unless justified against the performance budget and measured.
- **FR-044**: The Administration UI MUST remain usable on supported viewports without blocking staff from completing sign-in, draft, and publish; it is not required to meet public Core Web Vitals ranking targets.

#### Accessibility and responsive UI

- **FR-023**: Public foundation templates and Administration UI screens MUST meet WCAG 2.2 Level AA for perceivable, operable, understandable, and robust content.
- **FR-024**: Public templates and Administration UI screens MUST expose document landmarks, a skip-to-content mechanism, visible focus, and full keyboard operability for interactive controls.
- **FR-025**: Form-error patterns (public templates and Administration UI, including sign-in) MUST present accessible, field-level messages without discarding valid input.
- **FR-026**: Layout regions for the public site and the Administration UI MUST remain usable across mobile, tablet, desktop, and large-screen viewports and MUST support touch, pointer, and keyboard input.

#### Internationalisation readiness

- **FR-027**: User-facing strings in public templates and the Administration UI MUST be externalised as message keys; hard-coded copy MUST fail quality gates.
- **FR-028**: A locale URL strategy MUST be documented for the current single public locale and for adding locales later without rewriting public URLs ad hoc.
- **FR-029**: Dates, numbers, and layout direction MUST be prepared for locale-aware formatting in both public and administration surfaces; RTL readiness MUST be considered in layout regions even if only one locale ships initially.

#### Security

- **FR-030**: All public and administration traffic MUST be served over HTTPS in production and preview environments that represent production.
- **FR-031**: A documented security-header framework MUST apply to public and administration responses (including transport, content-type, and framing protections). Administration responses MUST additionally restrict indexing and embedding appropriate to a private workspace.
- **FR-032**: Secrets MUST be classified as public versus server-only; server-only values MUST NOT appear in client-delivered HTML, scripts, or assets for either surface.
- **FR-033**: Input-validation and output-encoding rules MUST be documented for administration operations and for future public dynamic submissions so later features do not invent insecure defaults.
- **FR-045**: Administration sign-in MUST use a server-backed session with idle timeout, credentials that are not usable from other sites, and protection so that a request forged on another site cannot change administration data.
- **FR-046**: Credentials and session tokens MUST NOT be exposed in public HTML, logs, or client-side storage that is not required for the session to function. Failed sign-in MUST NOT disclose whether an account exists.

#### Administration UI

- **FR-047**: The Administration UI MUST be a separate surface from the public site, with its own URL space, layout regions, and navigation for management tasks.
- **FR-048**: Only provisioned administrators MUST be able to sign in. There is no public self-registration in this phase.
- **FR-049**: Unauthenticated requests to administration addresses MUST NOT reveal staff-only content or unpublished records.
- **FR-050**: A signed-in administrator MUST be able to view and edit a placeholder content or site-settings record, save a **draft**, and **publish**. Drafts MUST NOT appear on the public static site.
- **FR-051**: Publish MUST follow a documented path that updates the public static site (or its content source) so visitors see only published versions.
- **FR-052**: Sign-out MUST end the session. After sign-out, administration content MUST NOT remain usable from the same browser without signing in again.
- **FR-053**: Administration UI copy, errors, and confirmations MUST use the same accessibility, i18n, and design-consistency baselines as other foundation UI (constitution principles V, IX, X, XI).
- **FR-054**: Changes made in the Administration UI MUST be attributable (who changed what, at what time) at a level sufficient to investigate mistakes; full audit-product features are out of scope.

#### Contract-first backend boundaries

- **FR-034**: Versioned, machine-readable contracts MUST be published before any consumer implementation for: form submission, newsletter signup, content schemas, analytics events, SEO metadata, administration sign-in, administration content/settings management, and publish.
- **FR-035**: Automated quality gates MUST validate those contracts and MUST reject invalid or incomplete contract changes.
- **FR-036**: Public presentation MUST depend on documented interfaces derived from contracts, not on the Administration UI being open at browse time.
- **FR-055**: The Administration UI MUST depend on documented interfaces derived from the administration and content contracts, not on undocumented backend internals.

#### Developer experience and maintainability

- **FR-037**: Project structure MUST be documented for public content, public layout regions, Administration UI layout regions, tests, configuration, and integration boundaries so a new contributor can locate each concern.
- **FR-038**: Naming conventions for public routes, administration routes, templates, contracts, and tests MUST be documented and applied consistently.
- **FR-039**: All commits MUST follow Conventional Commits.
- **FR-040**: An onboarding note and a quality-gate checklist MUST exist so contributors can verify SEO (public), administration non-indexability, accessibility, performance, security, i18n, and tests before calling work complete.

#### Environments, testing, and governance

- **FR-041**: Local, preview, and production environments MUST exist with documented parity for how public HTML is produced and how the Administration UI is reached; promotion MUST be blocked when quality gates fail.
- **FR-042**: Automated checks MUST cover shared helpers and contracts, public and administration layout primitives, metadata completeness, primary static visitor journeys, administration sign-in and draft/publish paths, accessibility, and SEO conventions (including administration exclusion from the public sitemap).
- **FR-043**: This specification is the baseline for subsequent features. Weakening SEO, accessibility, performance, security, i18n, or administration isolation baselines MUST require a documented, approved exception before implementation proceeds.

### Key Entities

- **Page Template**: A reusable **public** page shape with layout regions, heading hierarchy, metadata slots, and summary/body structure. Does not include marketing IA or populated copy.
- **Site Settings**: Site-wide defaults such as site name placeholder, default social-preview image slot, robots policy, and locale strategy. Distinct from per-page SEO Metadata. Editable in the Administration UI; only published values appear on the public site.
- **SEO Metadata**: Per-page title, description, canonical address, indexability flag, social-preview fields, and structured-data template bindings for **public** pages.
- **Integration Contract**: A versioned, machine-readable description of a backend boundary (form submission, newsletter, content schema, analytics event, SEO metadata schema, administration sign-in, administration management, or publish). Consumed through documented interfaces.
- **Analytics Event Schema**: Named events and properties for later measurement. Privacy-conscious; vendor-agnostic. Not an implemented tracker.
- **Message Key / Locale**: An externalised user-facing string identifier and the locale it belongs to, used by both public and administration surfaces. Foundation ships one locale; the model must allow additional locales later.
- **Administrator**: A provisioned staff identity allowed to use the Administration UI. Not a public visitor account.
- **Admin Session**: The signed-in period for an Administrator, with timeout and sign-out. Required to view or change administration content.
- **Managed Record**: A placeholder content or settings item with **draft** and **published** states. Only the published state is eligible for the public static site.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public foundation page templates and Administration UI foundation screens pass WCAG 2.2 AA automated checks with zero critical violations.
- **SC-002**: Representative **public** foundation pages achieve Core Web Vitals “Good” at the 75th percentile (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) on a typical mobile connection profile.
- **SC-003**: 100% of indexable **public** foundation routes appear in the sitemap, resolve successfully, and are reachable via at least one internal public link. 0% of Administration UI addresses appear in that sitemap.
- **SC-004**: Zero hard-coded user-facing strings remain in public templates or Administration UI (all copy is referenced by message key).
- **SC-005**: 100% of defined integration boundaries (including administration sign-in, content/settings management, and publish) have a published machine-readable contract before the first consumer implementation is merged.
- **SC-006**: Quality gates (static checks, tests, contract validation, and production build) are green before the foundation is marked complete; a failing gate blocks promotion.
- **SC-007**: A new placeholder **public** route can be added by following documented conventions in under one working hour by someone already familiar with the project, without weakening quality gates or inventing a parallel structure.
- **SC-008**: With client-side scripting disabled, visitors can still read public foundation template content and follow internal public links on 100% of public foundation routes.
- **SC-009**: 100% of unauthenticated requests to Administration UI addresses fail to expose staff-only or unpublished content (manual or automated check).
- **SC-010**: In a measured trial, a provisioned administrator can sign in, save a draft, and publish a placeholder record in under five minutes; the public page shows the change only after publish, on 100% of those trials.

## Assumptions

- This is a greenfield site; no legacy URL map or redirect inventory exists until a later specification provides one.
- A single locale ships in the foundation phase; architecture is i18n-ready so additional locales do not require a rewrite.
- There are no authenticated **public visitor** areas in this phase. Authentication exists only for the Administration UI.
- Public form, newsletter, and analytics **runtime** integrations remain later work; their contracts are still defined. Administration of those integrations is later.
- Traffic is typical for a corporate marketing site (thousands of visits per day), not hyperscale. Administration UI usage is a small number of internal staff.
- Hosting, CDN, CRM, email, analytics, and identity vendors are chosen in planning or later features, not in this specification.
- Design tokens and visual brand (exact colours, typefaces, logos) are supplied later; foundation defines layout regions and token placeholders only.
- “Frontend” means the public presentation and static delivery of pages. “Backend” means integration and data boundaries behind contracts. “Administration UI” means the staff workspace for managing published content and settings; it is not a public application.
- Sign-in uses a confidential, server-backed session rather than a public social-login product unless a later specification says otherwise.
- Foundation uses a single Administrator capability (provisioned staff who can draft and publish). Finer roles (editor vs publisher vs viewer) may be added later without changing public delivery.
- Administrators are created by an authorised operator; password recovery and SSO are specified later if needed.
- Core Web Vitals targets apply to representative **public** foundation templates on a mid-range mobile device profile. The Administration UI is held to accessibility and usability, not search-ranking vitals.
- WCAG 2.2 Level AA is the accessibility target for both public and administration surfaces unless a later specification raises it.

## Constraints

- Specifications and implementations MUST remain technology-agnostic at this stage; stack and tooling choices belong to `/speckit-plan`.
- Public pages MUST stay statically deliverable; introducing a required runtime for ordinary **public** browsing needs an explicit later specification.
- The Administration UI MUST NOT be used as a substitute public site and MUST NOT be indexed as marketing content.
- Company facts, clients, certifications, statistics, awards, testimonials, and locations MUST NOT be invented to fill structured data or copy.
- Third-party dependencies and custom abstractions MUST be justifiable against native HTML/browser capabilities and performance budgets (constitution principles II, VI, XII).
