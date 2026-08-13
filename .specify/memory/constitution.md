<!--
Sync Impact Report
- Version change: unratified (template placeholders) → 1.0.0
- Modified principles: N/A (initial ratification)
- Added sections:
  - Core Principles (13 engineering principles)
  - Scope of Governance
  - Development Workflow
  - Governance
- Removed sections: Template placeholder principles (PRINCIPLE_1–5 generic examples)
- Follow-up TODOs: None
-->

# Flycatch Website Constitution

## Core Principles

### I. SEO and AEO First

Discoverability and answer-engine optimisation (AEO) are first-class requirements for every
feature, page, and content surface. All specifications and implementations MUST address
search metadata, structured data, semantic content hierarchy, crawlability, indexability, and
answer-oriented content where applicable.

**Rationale**: Organic discovery and AI-assisted answer surfaces are primary acquisition
channels; they MUST be designed in, not bolted on.

### II. Native Elements First

Prefer semantic HTML, browser-native capabilities, and framework-native features before custom
components or third-party libraries. Custom abstractions MUST justify their cost against a
native or built-in alternative.

**Rationale**: Native elements reduce bundle size, improve accessibility and SEO, and align
with platform evolution.

### III. Contract-First Development

Define API and data contracts before implementation. Use OpenAPI (or equivalent machine-readable
schemas) where applicable. Implementation MUST NOT proceed without an agreed contract for
external or cross-boundary interfaces.

**Rationale**: Contracts enable parallel work, prevent integration drift, and make changes
reviewable and testable.

### IV. Conventional Commits

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification. Commit messages MUST use a valid type, optional scope, and clear description.

**Rationale**: Consistent commit history enables automated changelogs, semantic versioning, and
clear audit trails.

### V. Internationalisation by Default

No hard-coded user-facing strings. All copy MUST be externalised for translation. Dates,
numbers, currencies, timezones, and layouts MUST be locale-aware. RTL readiness MUST be
considered where applicable.

**Rationale**: i18n deferred to later phases is expensive to retrofit and excludes users.

### VI. Performance by Default

Minimise JavaScript payload, dependencies, network requests, rendering cost, and asset size.
Every feature MUST justify added weight against user value. Lazy-load and code-split where
appropriate.

**Rationale**: Performance is a core UX requirement, not an optimisation pass.

### VII. Core Web Vitals

Explicitly optimise and verify First Contentful Paint (FCP), Largest Contentful Paint (LCP),
Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP). Targets MUST be defined in
plans and verified before completion.

**Rationale**: Core Web Vitals are measurable, user-visible quality signals tied to search
ranking and satisfaction.

### VIII. Security by Default

Follow OWASP-aligned secure coding practices: least privilege, input validation, secure
authentication and authorisation, secret protection, and dependency security. Security
requirements MUST appear in specifications and be verified before release.

**Rationale**: Security defects in production are costly; prevention is mandatory.

### IX. Accessibility by Default

Use semantic HTML, keyboard navigation, labels, focus states, and accessible components.
Interfaces MUST meet applicable WCAG targets defined in feature specifications. Accessibility
MUST NOT be deferred.

**Rationale**: Accessible products serve all users and reduce legal and reputational risk.

### X. Design Consistency

Maintain a consistent design system: visual language, reusable components, design tokens,
typography, spacing, colours, states, and interaction patterns across the application. New UI
MUST reuse or extend the design system; deviations MUST be documented and approved.

**Rationale**: Consistency reduces cognitive load, speeds development, and strengthens brand
trust.

### XI. Responsive UI

All interfaces MUST provide a usable and consistent experience across mobile, tablet, desktop,
and large-screen devices, adapting to viewport size, content, and input method (touch, pointer,
keyboard).

**Rationale**: Users access the site from diverse devices; responsive design is non-negotiable.

### XII. Production-Grade Standard

All features and implementations MUST be production-ready: reliability, maintainability,
security, observability, scalability, accessibility, performance, error handling, testing, and
operational readiness MUST meet defined standards before completion.

**Rationale**: Prototype-quality code in production creates debt, incidents, and rework.

### XIII. Quality Gates

Before marking work complete, verify functionality, contracts, security, accessibility,
SEO/AEO, internationalisation, performance, and tests. No feature ships without passing
applicable quality gates documented in the plan and tasks.

**Rationale**: Explicit gates prevent principle violations from reaching production.

## Scope of Governance

These principles are mandatory governance for all subsequent specifications, plans, tasks, and
implementations. Every Spec Kit artifact (spec.md, plan.md, tasks.md) MUST trace requirements
and acceptance criteria to applicable constitution principles. Deviations MUST be explicitly
documented, justified, and approved before implementation proceeds.

## Development Workflow

1. **Specify**: Feature specs MUST list affected principles and non-functional requirements
   derived from them (SEO/AEO, i18n, a11y, performance, security, responsive UI).
2. **Plan**: Implementation plans MUST include contract definitions, design-system alignment,
   and measurable targets (Core Web Vitals, WCAG level, locale coverage).
3. **Tasks**: Task breakdowns MUST include quality-gate verification steps and test coverage for
   contracts and critical paths.
4. **Implement**: Code MUST use Conventional Commits; PRs MUST demonstrate compliance with
   applicable principles before merge.
5. **Review**: Reviews MUST reject work that violates constitution principles unless an approved
   deviation is recorded.

## Governance

This constitution supersedes ad-hoc practices and informal conventions for the Flycatch Website
project. Amendments require:

1. Documented rationale and impact assessment
2. Semantic version bump per policy below
3. Update to `.specify/memory/constitution.md` with Sync Impact Report
4. Propagation review of dependent templates and active feature artifacts

**Versioning policy**:

- **MAJOR**: Backward-incompatible governance changes, principle removals, or redefinitions
- **MINOR**: New principles or materially expanded guidance
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

**Compliance**: All pull requests and Spec Kit reviews MUST verify compliance with applicable
principles. Complexity and third-party dependencies MUST be justified against Principles II, VI,
and XII.

**Version**: 1.0.0 | **Ratified**: 2026-08-13 | **Last Amended**: 2026-08-13
