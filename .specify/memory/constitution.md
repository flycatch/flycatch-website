<!--
Sync Impact Report
- Version change: (unratified template) → 1.0.0
- Modified principles: N/A (initial ratification from placeholders)
- Added sections:
  - Core Principles I–X (SEO/AEO First; Native Elements First;
    Contract-First Development; Conventional Commits;
    Internationalisation by Default; Performance by Default;
    Core Web Vitals; Security by Default; Accessibility by Default;
    Quality Gates)
  - Applicability
  - Development Workflow
  - Governance
- Removed sections: N/A (template placeholders replaced)
- Follow-up TODOs: none
-->

# Flycatch Website Constitution

## Core Principles

### I. SEO and AEO First
Discoverability and answer-engine optimisation are first-class
requirements for every user-facing surface. Specs, plans, tasks, and
implementations MUST define crawlable structure, meaningful metadata,
machine-readable signals (for example structured data where applicable),
and content that can be cited by answer engines. Shipping without an
SEO/AEO plan is non-compliant.

**Rationale**: Organic discovery and answer-engine visibility are
product requirements, not post-launch polish.

### II. Native Elements First
Prefer semantic HTML, browser-native capabilities, and framework-native
features before custom components or third-party libraries. A custom
component or dependency MUST be justified only when native options cannot
meet an explicit requirement.

**Rationale**: Native primitives improve accessibility, performance,
maintainability, and long-term portability.

### III. Contract-First Development
Define API and data contracts before implementation. Where HTTP or
service boundaries exist, contracts MUST be expressed with OpenAPI (or an
equivalent machine-readable contract) and implementation MUST conform to
the approved contract. Contract changes require an explicit update before
code changes land.

**Rationale**: Stable contracts reduce integration defects and enable
parallel work across clients, services, and tests.

### IV. Conventional Commits
All commits MUST follow the Conventional Commits specification
(`type[optional scope]: description`). Commit history MUST remain
machine-parsable for changelog and release tooling.

**Rationale**: Consistent commit semantics enable automation, clearer
reviews, and predictable release notes.

### V. Internationalisation by Default
No hard-coded user-facing strings. Copy MUST go through the project's
i18n mechanism. Dates, numbers, currencies, and timezones MUST be
locale-aware. Layout and components MUST remain RTL-ready where the
product supports bidirectional locales.

**Rationale**: Retrofitting i18n is costly and error-prone; locale
correctness is a default product quality bar.

### VI. Performance by Default
Minimise JavaScript shipped, third-party dependencies, network requests,
rendering cost, and asset size. New dependencies and client-side work
MUST be justified against measured or clearly argued cost.

**Rationale**: Lean delivery improves UX, SEO, and operating cost on
every device and network.

### VII. Core Web Vitals
Explicitly optimise and verify FCP, LCP, CLS, and INP for user-facing
routes. Plans and implementations MUST identify vital risks and
verification method; regressions against agreed budgets are blockers.

**Rationale**: Core Web Vitals are measurable user-experience and
ranking signals that require continuous attention.

### VIII. Security by Default
Apply OWASP-aligned secure coding. Enforce least privilege, validate and
sanitise untrusted input, use secure authentication and authorisation,
protect secrets from source and logs, and maintain dependency security
hygiene. Security-sensitive changes MUST be reviewed for these controls
before completion.

**Rationale**: Security defects are product defects; defaults must favour
safe behaviour.

### IX. Accessibility by Default
Use semantic HTML, full keyboard navigation, correctly associated labels,
visible focus states, and accessible component patterns. User-facing work
MUST meet the project's accessibility standard and MUST NOT ship known
critical a11y regressions.

**Rationale**: Inclusive access is a baseline requirement, not an
optional enhancement.

### X. Quality Gates
Before marking work complete, verify functionality, contracts, security,
accessibility, SEO/AEO, i18n, performance (including Core Web Vitals where
applicable), and automated/manual tests required by the feature. Incomplete
gates mean the work is not done.

**Rationale**: A single completion checklist prevents silent gaps across
cross-cutting concerns.

## Applicability

This constitution is mandatory governance for all Spec Kit artifacts and
delivery work on Flycatch Website, including:

- Feature specifications (`spec.md` and related clarify/analyze outputs)
- Implementation plans and design artifacts
- Task breakdowns and issue conversion
- Implementation, review, and completion criteria

Any specification, plan, task list, or implementation that omits or
contradicts these principles is non-compliant until amended.

## Development Workflow

1. **Specify**: Capture user-facing and cross-cutting requirements for
   SEO/AEO, i18n, accessibility, security, performance, and contracts.
2. **Plan**: Choose native-first approaches, define OpenAPI/data
   contracts before build work, and identify Core Web Vitals and
   dependency budgets.
3. **Task**: Break work so quality gates are explicit and testable.
4. **Implement**: Deliver against contracts and principles; keep commits
   Conventional Commits-compliant.
5. **Complete**: Pass Principle X quality gates before closing the
   feature.

Complexity, new dependencies, and custom abstractions MUST be justified
in the plan or PR description.

## Governance

This constitution supersedes conflicting informal practices. Amendments
MUST update `.specify/memory/constitution.md`, bump `CONSTITUTION_VERSION`
using semantic versioning, set **Last Amended** to the amendment date, and
record impact in the Sync Impact Report comment.

Versioning policy:

- **MAJOR**: Remove or redefine a principle in a backward-incompatible way
- **MINOR**: Add a principle/section or materially expand guidance
- **PATCH**: Clarifications, wording, or non-semantic refinements

Compliance review expectations:

- Specs, plans, tasks, PRs, and implementations MUST be reviewable against
  Principles I–X
- Reviewers MUST reject work that skips applicable quality gates without
  an explicit, documented waiver
- Waivers are exceptional, time-bounded, and MUST name the principle,
  risk, and follow-up

**Version**: 1.0.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-12
