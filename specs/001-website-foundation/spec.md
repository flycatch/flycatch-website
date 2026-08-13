# Feature Specification: Website Foundation

**Feature Branch**: `001-website-foundation`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Create the Foundation Specification for the official company website of Flycatch Infotech, built from scratch. Establish complete foundational architecture, conventions, boundaries, and quality requirements that all subsequent website features and pages must follow."

**Constitution alignment**: This specification implements mandatory governance from `.specify/memory/constitution.md` (v1.0.0). All requirements trace to constitution principles I–XIII unless marked as context-dependent.

---

## Foundation Scope

### In scope

- Foundational information architecture, URL conventions, and navigation model for a corporate marketing website
- Technical architecture boundaries (content, presentation, logic, integrations)
- Design-system foundation (tokens, primitives, responsive and accessible conventions)
- Content architecture and content models for current and future page types
- Cross-cutting requirements: SEO, AEO, accessibility, internationalisation readiness, performance, security
- Forms and lead-generation foundation (contact, enquiry, newsletter patterns)
- Analytics and observability conventions (privacy-conscious)
- Testing strategy, CI quality gates, and acceptance criteria
- Developer experience, maintainability, and documentation expectations
- Environment, deployment, and production-readiness requirements
- Contract-first boundaries for integrations and data exchange
- Governance rules for all subsequent feature specifications

### Out of scope (foundation phase)

- Specific page copy, imagery, or company claims not yet provided by Flycatch Infotech
- Selection of specific CRM, email provider, hosting vendor, or analytics product (requirements only)
- Implementation code, framework choice, or repository scaffolding (deferred to `/speckit-plan`)
- Authenticated user areas (client portals, employee login) unless added by a future specification
- E-commerce, payments, or transactional commerce flows
- Detailed visual brand identity (logo files, exact colour hex values) unless supplied separately

### Goals

1. Clearly communicate who Flycatch Infotech is and what the company offers
2. Establish trust and professional credibility
3. Generate qualified business enquiries and leads
4. Make services, capabilities, expertise, and company information easy to discover
5. Deliver an excellent experience across mobile, tablet, desktop, and large screens
6. Achieve high discoverability through search engines and answer engines
7. Establish a maintainable foundation for future pages, content, integrations, and features

### Non-goals

- Replicating features of unrelated product categories (SaaS dashboards, social networks, etc.)
- Maximising third-party integrations or client-side complexity without documented business need
- Launching with full multilingual content unless a subsequent specification defines locale rollout
- Inventing company facts, clients, certifications, statistics, awards, testimonials, or locations

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover company and submit enquiry (Priority: P1)

A prospective client finds the Flycatch Infotech website through search or referral, quickly understands what the company does, navigates to contact or enquiry, and successfully submits a lead form with clear confirmation.

**Why this priority**: Lead generation and credibility are primary business goals for a corporate marketing site.

**Independent Test**: Can be validated by completing a full visitor journey from homepage to successful form submission without relying on any page beyond foundation layouts, navigation, and form patterns.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on any device, **When** they land on the homepage, **Then** they can identify the company name, primary value proposition area, and a clear path to contact or enquiry within one viewport scroll or one navigation action
2. **Given** a visitor on a contact or enquiry page, **When** they complete required fields with valid input and submit, **Then** they receive an accessible success confirmation and the submission is handled securely
3. **Given** a visitor submits invalid or incomplete form data, **When** validation runs, **Then** they receive accessible, field-level error messages without losing previously entered valid data

---

### User Story 2 - Find services and capabilities (Priority: P2)

A visitor wants to understand Flycatch Infotech's services, expertise, or industry focus. They use primary navigation, internal links, or search-engine landing to reach relevant content and understand offerings at a glance.

**Why this priority**: Service discoverability supports qualification of leads and reduces bounce from unclear positioning.

**Independent Test**: Can be validated by navigating from global navigation to a service or capability listing/detail pattern using foundation IA and content models only.

**Acceptance Scenarios**:

1. **Given** a visitor using primary navigation, **When** they select a top-level section (e.g., Services, About, Contact), **Then** they reach a stable, human-readable URL with clear page title and heading hierarchy
2. **Given** a visitor on a service detail page, **When** they read the page, **Then** they encounter a concise summary suitable for search snippets and answer-engine extraction, plus deeper explanatory content
3. **Given** a visitor on an interior page, **When** they orient themselves, **Then** breadcrumbs or equivalent hierarchical cues reflect their location within the site structure

---

### User Story 3 - Discover via search and answer engines (Priority: P2)

A user or answer engine queries for information about Flycatch Infotech or its offerings. The website exposes crawlable, indexable, structured content that supports accurate retrieval and snippet generation.

**Why this priority**: SEO and AEO are constitution-mandated first-class requirements.

**Independent Test**: Can be validated by auditing foundation metadata, sitemap, robots, heading structure, and structured-data conventions on representative page templates without full content population.

**Acceptance Scenarios**:

1. **Given** a public marketing page, **When** inspected for SEO foundation compliance, **Then** it includes unique title, meta description, canonical URL, logical heading hierarchy, and indexability rules appropriate to page intent
2. **Given** a page representing an organisation, service, or FAQ pattern, **When** structured data is applicable, **Then** machine-readable markup conforms to documented foundation schemas without inventing unverified facts
3. **Given** a site-wide crawl, **When** sitemap and internal linking conventions are applied, **Then** all indexable foundation routes are discoverable without orphan pages

---

### User Story 4 - Extend site without breaking conventions (Priority: P3)

A developer or content owner adds a new page, section, or integration following foundation rules. The addition inherits quality gates, contracts, and architectural boundaries without one-off exceptions.

**Why this priority**: Maintainability and scalability depend on enforced conventions from day one.

**Independent Test**: Can be validated by adding a hypothetical new content type (e.g., a new resource article) against documented IA, content model, and quality-gate checklists.

**Acceptance Scenarios**:

1. **Given** a new page type proposal, **When** reviewed against foundation IA rules, **Then** its URL, navigation placement, and breadcrumb behaviour are determinable from documented conventions
2. **Given** a new external integration, **When** designed, **Then** it uses a documented contract boundary and does not embed secrets or vendor-specific logic in presentation components
3. **Given** a new reusable UI pattern, **When** added to the design system, **Then** it meets accessibility, responsive, and token conventions before use on production pages

---

### Edge Cases

- What happens when a visitor requests a non-existent URL? → Custom, accessible 404 page with navigation recovery paths; appropriate `noindex` where applicable
- What happens when JavaScript is unavailable or fails? → Core content, navigation, and form submission degrade gracefully via progressive enhancement; essential information remains accessible
- What happens when a visitor uses keyboard-only, screen reader, or high-contrast modes? → All foundation patterns remain operable and perceivable per WCAG targets
- What happens when content is missing for a optional field (e.g., testimonial not yet approved)? → Page templates handle absent content without broken layout or placeholder lorem in production
- What happens when form submission fails due to network or server error? → User sees accessible error state with retry guidance; no silent failure
- What happens when duplicate URLs or legacy paths exist? → Canonical URLs and redirect rules prevent duplicate-content indexing
- What happens when a future locale is added? → URL, metadata, and content-key conventions allow locale introduction without restructuring routes or hard-coded strings

---

## Requirements *(mandatory)*

Requirements use IDs for traceability. **FR-Fxxx** = foundation requirement. Constitution principles referenced in parentheses.

### 1. Information Architecture

- **FR-F001**: The site MUST define a primary navigation model with stable top-level sections appropriate for a corporate marketing site (e.g., Home, Services, About, Contact); exact labels and count MUST be confirmed before launch content spec (Principle I, XI)
- **FR-F002**: All public pages MUST use human-readable, lowercase, hyphen-separated URLs reflecting content hierarchy (e.g., `/services/{service-slug}`); URL slugs MUST remain stable after publish and change only via documented redirects (Principle I)
- **FR-F003**: The IA MUST define content categories and allowed nesting depth; new pages MUST map to an existing category or require a documented IA amendment (Principle I, X)
- **FR-F004**: Breadcrumbs MUST appear on nested pages deeper than level-two hierarchy unless a page type explicitly exempts them with documented rationale (Principle IX, I)
- **FR-F005**: Internal linking rules MUST require every indexable page to be reachable from navigation or contextual links; orphan indexable pages are prohibited (Principle I)
- **FR-F006**: Foundation MUST define rules for future page types (case studies, blog posts, industries, resources) including URL prefix, listing/detail relationship, and pagination URL pattern where applicable (Principle I)

### 2. Technical Architecture

- **FR-F010**: The website MUST use a rendering strategy that prioritises server-delivered HTML for primary content and minimises client-side JavaScript for static marketing content (Principles II, VI)
- **FR-F011**: Architecture MUST enforce separation of concerns: content/data, presentation/templates, application/orchestration logic, and external integrations MUST remain in distinct bounded layers (Principle III, XII)
- **FR-F012**: Client-side JavaScript MUST be additive (progressive enhancement); core journeys (read content, navigate, submit forms) MUST function without requiring client-side execution for essential outcomes (Principles II, VI)
- **FR-F013**: The foundation MUST define reusable layout regions (header, main, footer, skip links, announcement banner slot) consistent across pages (Principles X, XI)
- **FR-F014**: Shared utilities (formatting, locale helpers, link builders, metadata builders) MUST be centralised; page-level duplication of cross-cutting logic is prohibited (Principle XII)
- **FR-F015**: Architecture MUST support growth (new routes, content types, locales, integrations) without restructuring core boundaries (Principle XII)

### 3. Design-System Foundation

- **FR-F020**: The design system MUST define tokens for colour, typography, spacing, elevation, border radius, motion, and breakpoints (Principle X)
- **FR-F021**: Typography scale, line length limits, and heading levels MUST be defined for readable hierarchy across viewports (Principles X, IX, XI)
- **FR-F022**: Reusable UI primitives (buttons, links, form fields, cards, navigation, alerts, modals/dialogs) MUST be specified separately from page-specific compositions (Principle X)
- **FR-F023**: All interactive components MUST define keyboard, focus-visible, hover, active, disabled, and loading states (Principles IX, X)
- **FR-F024**: Custom components MUST justify deviation from native HTML elements; native semantic elements MUST be preferred when they meet requirements (Principle II)
- **FR-F025**: Responsive behaviour MUST be defined mobile-first with documented breakpoint behaviour for layout, navigation (including mobile menu pattern), and typography (Principle XI)

### 4. Content Architecture

- **FR-F030**: Content MUST be stored separately from presentation templates wherever practical; templates bind to structured content fields, not ad-hoc markup in code (Principles II, V)
- **FR-F031**: Foundation MUST define content models (fields, required vs optional, validation rules) for: Company/About, Service, Case Study/Project, Industry, Testimonial, Blog/Resource Article, Contact/Office, FAQ, and Global Site Settings (Principle I, V)
- **FR-F032**: Content models MUST include SEO/AEO fields: title, summary/answer snippet, meta description, slug, canonical override (optional), og fields, structured-data inputs, and publish status (Principle I)
- **FR-F033**: Content ownership and review expectations MUST be defined: who authorises publish, who validates factual claims, and prohibition on publishing unverified company facts (Principle XII)
- **FR-F034**: Rich text content MUST support semantic headings, lists, links, and images with required alt text; presentational-only markup in content is discouraged (Principles IX, I)
- **FR-F035**: Media assets MUST include alt text, dimensions, and preferred format guidance in the content model (Principles I, VI)

### 5. SEO Foundation

- **FR-F040**: Every indexable page MUST have a unique document title (50–60 character target), meta description (150–160 character target), and self-referencing canonical URL unless a documented exception applies (Principle I)
- **FR-F041**: The site MUST provide an XML sitemap covering all indexable URLs and a robots.txt governing crawl behaviour (Principle I)
- **FR-F042**: Exactly one `<h1>` per page MUST reflect primary page topic; heading levels MUST not skip levels (Principle I, IX)
- **FR-F043**: Image elements MUST have descriptive alt attributes; decorative images MUST use empty alt (Principle I, IX)
- **FR-F044**: Redirect strategy MUST be defined for URL changes (301 permanent); redirect chains beyond one hop are prohibited in steady state (Principle I)
- **FR-F045**: Pagination, filtering, and listing pages MUST define canonical and indexation rules to prevent duplicate-content issues (Principle I)
- **FR-F046**: Open Graph and basic social sharing metadata MUST be defined at foundation level (Principle I)

### 6. AEO / Answer-Engine Optimisation

- **FR-F050**: Key pages MUST include concise, authoritative answer blocks (company description, service summaries, definitions) suitable for featured snippets and answer-engine citation (Principle I)
- **FR-F051**: FAQ content patterns MUST use question–answer structure with clear, factual responses; FAQ schema MUST be supported where content exists (Principle I)
- **FR-F052**: Structured data MUST use documented schema types (Organisation, WebSite, WebPage, Service, FAQPage, BreadcrumbList as applicable) without fabricating ratings, reviews, or awards (Principle I)
- **FR-F053**: Content MUST avoid keyword stuffing, hidden text, or manipulative SEO/AEO tactics (Principle I)
- **FR-F054**: Entity information (legal company name, website URL, logo reference, contact point types) MUST be modelled for structured output when verified data is available (Principle I)

### 7. Accessibility

- **FR-F060**: The website MUST conform to **WCAG 2.2 Level AA** as the baseline target for all foundation patterns and subsequent pages (Principle IX)
- **FR-F061**: Pages MUST use semantic landmarks (`header`, `nav`, `main`, `footer`) and a skip-to-main-content link (Principle IX)
- **FR-F062**: All functionality MUST be operable via keyboard; focus order MUST be logical and focus indicators visible (Principle IX)
- **FR-F063**: Interactive elements MUST have accessible names; form fields MUST have associated labels; errors MUST be programmatically associated with fields (Principle IX)
- **FR-F064**: Colour contrast MUST meet WCAG AA minimums for text and interactive components (Principle IX)
- **FR-F065**: Motion and animation MUST respect `prefers-reduced-motion`; essential information MUST not depend on animation alone (Principle IX)
- **FR-F066**: Media MUST provide captions or transcripts where applicable; autoplay with sound is prohibited (Principle IX)

### 8. Internationalisation

- **FR-F070**: No user-facing strings MAY be hard-coded in application or UI code; all copy MUST use externalised message keys (Principle V)
- **FR-F071**: Foundation MUST define locale-aware formatting for dates, numbers, currencies, and timezones (Principle V)
- **FR-F072**: Layouts MUST support text expansion and RTL mirroring without breaking structure (Principle V)
- **FR-F073**: URL strategy for future locales MUST be documented (e.g., prefix `/en/`, `/ar/`) including hreflang metadata rules when multiple locales publish (Principle V, I)
- **FR-F074**: Initial launch MAY be single-locale; architecture MUST NOT require rework to add locales later (Principle V)

### 9. Performance

- **FR-F080**: Foundation MUST define Core Web Vitals targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at 75th percentile on representative pages under documented test conditions (Principle VII)
- **FR-F081**: Performance budgets MUST be defined for total page weight, JavaScript weight, font payload, and third-party script count (Principle VI)
- **FR-F082**: Images MUST use responsive sizing, appropriate compression, and lazy loading below the fold; LCP image MUST be prioritised without lazy-load (Principle VI, VII)
- **FR-F083**: Fonts MUST use efficient loading strategy (subset, limited families/weights, avoid invisible text during load) (Principle VI)
- **FR-F084**: Render-blocking resources MUST be minimised; critical content MUST be visible without waiting for non-essential scripts (Principle VI)
- **FR-F085**: Third-party scripts MUST require documented justification and MUST not block primary content render (Principles VI, XII)

### 10. Security

- **FR-F090**: The site MUST enforce HTTPS in production with valid TLS configuration (Principle VIII)
- **FR-F091**: Security headers baseline MUST be defined (e.g., Content-Security-Policy framework, X-Content-Type-Options, Referrer-Policy, Permissions-Policy); exact values deferred to plan (Principle VIII)
- **FR-F092**: Secrets and API keys MUST NOT be exposed to client-side code; environment variables MUST be classified as public vs server-only (Principle VIII)
- **FR-F093**: All user input MUST be validated server-side; output MUST be encoded appropriately for HTML context (Principle VIII)
- **FR-F094**: Dependencies MUST be monitored for known vulnerabilities; updates MUST follow documented patch policy (Principle VIII)
- **FR-F095**: Logging MUST avoid storing personally identifiable information beyond documented retention need (Principle VIII)
- **FR-F096**: Authentication and authorisation patterns MUST be defined only when a future spec introduces protected areas; default is no authenticated surface (Principle VIII)

### 11. Forms and Lead Generation

- **FR-F100**: Foundation MUST define form patterns for contact/enquiry and optional newsletter signup with accessible labels, hints, required field indicators, and error summaries (Principles IX, XI)
- **FR-F101**: Form submission MUST use a contract-first integration boundary; submission payload schema MUST be documented before implementation (Principle III)
- **FR-F102**: Forms MUST implement spam/abuse protection (rate limiting, honeypot, challenge, or equivalent) without blocking accessible use (Principle VIII)
- **FR-F103**: Privacy notice and consent expectations MUST be defined adjacent to data collection forms; exact legal copy supplied by stakeholders (Principle VIII)
- **FR-F104**: Success, error, and loading states MUST be perceivable to assistive technology and visible to sighted users (Principles IX, XII)
- **FR-F105**: Form integrations MUST NOT tightly couple UI components to a specific vendor; adapter layer required (Principle III)

### 12. Analytics and Observability

- **FR-F110**: Analytics MUST be privacy-conscious: collect only documented business events, minimise personal data, respect consent where required (Principle VIII, VI)
- **FR-F111**: Foundation MUST define a canonical event catalogue for conversions: form submission success, primary CTA clicks, service enquiry starts, and other business-meaningful interactions (Principle XII)
- **FR-F112**: Analytics event schema MUST be versioned and contract-defined (Principle III)
- **FR-F113**: Error monitoring and performance monitoring expectations MUST be defined for production; no unhandled client errors silently discarded (Principle XII)
- **FR-F114**: Third-party analytics tags MUST be loaded in a performance-preserving, consent-aware manner when applicable (Principles VI, VIII)

### 13. Testing and Quality

- **FR-F120**: Testing strategy MUST include: unit tests for utilities and contracts, component tests for design-system primitives, integration tests for form submission and metadata generation, E2E tests for primary user journeys, accessibility audits, SEO/AEO checklist validation, and performance regression checks (Principle XIII)
- **FR-F121**: CI MUST enforce quality gates: linting, tests, contract validation, accessibility checks (automated), and build success before merge/deploy (Principle XIII)
- **FR-F122**: New pages and components MUST inherit foundation test requirements; bypassing gates requires documented exception (Principle XIII)
- **FR-F123**: Visual regression testing MAY be introduced for design-system components; scope deferred to plan (Principle XIII)

### 14. Developer Experience and Maintainability

- **FR-F130**: Project structure MUST be documented at architectural level: locations for content, components, layouts, utilities, assets, tests, configuration, and integration adapters (Principle XII)
- **FR-F131**: Naming conventions MUST be defined for routes, content types, components, message keys, and test files (Principle XII)
- **FR-F132**: Dependency additions MUST be justified against bundle size, security posture, and native-alternative assessment (Principles II, VI, VIII)
- **FR-F133**: Foundation documentation MUST include: IA map, content model reference, contract index, design token reference, quality-gate checklist, and onboarding guide (Principle XII)
- **FR-F134**: All commits MUST follow Conventional Commits per constitution (Principle IV)

### 15. Environment and Deployment

- **FR-F140**: Environments MUST be defined: local development, preview/staging, and production with parity of build process (Principle XII)
- **FR-F141**: Environment variables MUST be documented with scope (build-time vs runtime, public vs secret) (Principle VIII)
- **FR-F142**: Deployment MUST run build validation and quality gates; failed gates block promotion to production (Principle XIII)
- **FR-F143**: Production MUST use CDN or edge caching for static assets with documented cache invalidation on deploy (Principle VI)
- **FR-F144**: Production configuration MUST include HTTPS, compression, and security headers per security requirements (Principles VI, VIII)

### 16. Contract-First Boundaries

- **FR-F150**: The following boundaries MUST have explicit, versioned contracts before implementation: form submission API, newsletter subscription API, content type schemas, analytics event payloads, SEO metadata schema, and any third-party integration adapters (Principle III)
- **FR-F151**: Contracts MUST be validated in CI where machine-readable schemas exist (OpenAPI, JSON Schema, or equivalent) (Principle III)
- **FR-F152**: Presentation components MUST consume integration data through documented interfaces, not direct vendor SDK coupling in UI layer (Principle III)

### 17. Governance

- **FR-F160**: This foundation specification is the baseline for all subsequent Flycatch Website feature specifications; conflicting requirements MUST be rejected or require a documented exception (Constitution Scope of Governance)
- **FR-F161**: Requirements labelled **MUST** in this document are mandatory unless an approved exception records rationale, scope, and expiry (Constitution Governance)
- **FR-F162**: Subsequent specs MUST trace each requirement to foundation IDs and constitution principles (Constitution Development Workflow)
- **FR-F163**: Feature specs MUST NOT silently weaken SEO, AEO, accessibility, i18n, performance, or security baselines established here (Principle XIII)

### Key Entities

- **Site Settings**: Global configuration (site name, default metadata, navigation structure, footer content, social links, locale defaults)
- **Page**: Routable document with slug, type, metadata, content blocks, indexation flags, and publish state
- **Service**: Offering description with name, summary, detailed body, related industries, and CTA references
- **Case Study / Project**: Client work narrative with title, summary, challenge/solution/outcome fields (client identity subject to approval)
- **Industry**: Vertical focus area linking to related services and case studies
- **Testimonial**: Approved quote with attribution fields; publication requires verified consent
- **Blog / Resource Article**: Dated or topical content with author, summary, body, and taxonomy tags
- **FAQ Item**: Question, answer, optional category, schema eligibility flag
- **Contact Enquiry**: Submission record with form version, timestamp, fields, source page, and processing status (PII — handle per privacy policy)
- **Analytics Event**: Named, versioned business event with documented properties
- **Content Locale**: Language/region identifier bound to translated message keys and content variants

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can reach contact/enquiry submission from the homepage in no more than 3 clicks on any supported device form factor
- **SC-002**: 100% of foundation page templates pass WCAG 2.2 Level AA automated checks with zero critical violations before first production release
- **SC-003**: Representative foundation pages achieve "Good" Core Web Vitals (LCP, INP, CLS) at 75th percentile under documented test conditions
- **SC-004**: 100% of indexable foundation routes appear in the XML sitemap and are reachable via navigation or internal links
- **SC-005**: Zero hard-coded user-facing strings in application/UI code; all copy externalised to message keys
- **SC-006**: All integration boundaries defined in this spec have documented contracts before their first implementation merges
- **SC-007**: Primary user journeys (discover company, find services, submit enquiry) complete successfully in E2E tests across mobile and desktop viewport profiles
- **SC-008**: Form submission success rate of ≥ 99% excluding user validation errors and documented third-party outages during acceptance testing
- **SC-009**: Subsequent feature specifications can cite foundation requirement IDs without redefining baseline SEO, accessibility, or performance targets

---

## Cross-Cutting Quality Gates

Before any foundation milestone or dependent feature is marked complete:

| Gate | Verification |
|------|----------------|
| Functionality | Primary user journeys pass manual and automated tests |
| Contracts | Schemas published and validated for all integration boundaries |
| Security | No secrets in client bundle; input validation and headers checklist pass |
| Accessibility | WCAG 2.2 AA audit pass on all template patterns |
| SEO | Metadata, sitemap, robots, canonical, heading hierarchy checklist pass |
| AEO | Answer blocks and structured-data templates validated without fabricated facts |
| i18n | String externalisation audit pass; locale helpers documented |
| Performance | Core Web Vitals and budget checks pass on representative pages |
| Tests | CI pipeline green including lint, unit, integration, and E2E suites |

---

## Assumptions

- **A-001**: Initial launch content will be in English; architecture prepares for additional locales without restructure (FR-F074)
- **A-002**: WCAG 2.2 Level AA is the correct baseline for a B2B corporate marketing website (FR-F060)
- **A-003**: No authenticated visitor areas are required at foundation stage (FR-F096)
- **A-004**: Flycatch Infotech will supply verified company facts, legal copy, privacy policy text, and approved testimonials before publish (FR-F033, FR-F054)
- **A-005**: Lead form backend (email relay, CRM, or custom API) will be selected during planning; foundation defines contract only (FR-F101)
- **A-006**: Analytics provider will be selected during planning; foundation defines event catalogue and loading constraints only (FR-F111)
- **A-007**: Visual brand assets (logo, colour palette, typography choices) will be supplied or defined in a separate brand/design input before UI implementation
- **A-008**: Traffic scale is typical for a corporate marketing site (thousands—not millions—of daily visitors); architecture optimises for maintainability and performance without premature hyperscale complexity

---

## Open Questions and Decision Points

Resolve before `/speckit-plan` or early planning phase:

| ID | Question | Impact | Default if unresolved |
|----|----------|--------|---------------------|
| OQ-001 | What are the confirmed top-level navigation sections and labels for launch? | IA, URLs, sitemap | Use placeholder IA: Home, Services, About, Contact |
| OQ-002 | Which content types are required at launch vs phased later (blog, case studies, industries)? | Content models, MVP scope | Launch with About, Services, Contact; defer blog/case studies to feature specs |
| OQ-003 | What verified Organisation facts are available (legal name, founding date, address, phone, social profiles)? | Structured data, footer, contact | Omit unverified fields; no fabricated schema values |
| OQ-004 | What lead routing backend is preferred (email, CRM, custom API)? | Form contract design | Abstract contract; adapter decided in plan |
| OQ-005 | Is cookie/consent banner required for target jurisdictions? | Analytics loading, legal copy | Plan for consent-aware loading; exact jurisdictions TBD with legal |
| OQ-006 | Are there existing domains, legacy URLs, or redirect requirements? | Redirect map, canonical rules | Greenfield assumed; no legacy redirects until confirmed |

---

## Constraints

- MUST comply with `.specify/memory/constitution.md` v1.0.0 without weakening principles
- MUST NOT invent company facts, services, clients, certifications, or metrics
- MUST prefer native HTML, semantic structure, and progressive enhancement over custom abstractions
- MUST NOT lock into specific vendors without documented requirement and plan-phase evaluation
- MUST distinguish confirmed requirements from assumptions and open questions above
- MUST keep implementation technology choices in the plan phase unless only one architecture satisfies mandatory requirements

---

## Traceability Index

Subsequent specifications SHOULD reference foundation IDs:

| Area | Requirement IDs |
|------|-----------------|
| Information Architecture | FR-F001–FR-F006 |
| Technical Architecture | FR-F010–FR-F015 |
| Design System | FR-F020–FR-F025 |
| Content Architecture | FR-F030–FR-F035 |
| SEO | FR-F040–FR-F046 |
| AEO | FR-F050–FR-F054 |
| Accessibility | FR-F060–FR-F066 |
| Internationalisation | FR-F070–FR-F074 |
| Performance | FR-F080–FR-F085 |
| Security | FR-F090–FR-F096 |
| Forms / Leads | FR-F100–FR-F105 |
| Analytics | FR-F110–FR-F114 |
| Testing / Quality | FR-F120–FR-F123 |
| Developer Experience | FR-F130–FR-F134 |
| Environment / Deploy | FR-F140–FR-F144 |
| Contracts | FR-F150–FR-F152 |
| Governance | FR-F160–FR-F163 |
