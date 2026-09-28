---
description: "Task list for site-wide public page entrance motion"
---

# Tasks: Public Page Entrance Motion

**Input**: Design documents from `/specs/037-page-entrance-motion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-entrance-motion.v1.md, quickstart.md

**Tests**: Playwright coverage is required by the spec (sample of IA groups, in-body reveal, reduced motion, no-JS, header pin). Write the spec files so they fail before the matching behaviour exists.

**Organization**: Tasks are grouped by user story. P1 stories (heading entrance, then reduced-motion/no-JS) come before P2 (header, then in-body reveals).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)
- Every task includes an exact file path

## Path Conventions

- Public Frontend only: `apps/Frontend/`
- No Backend, Administration-FE, or new npm animation libraries

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Motion tokens the shared CSS will reference. No new dependencies.

- [X] T001 Add `--motion-entrance: 0.6s ease-out` and `--motion-nav-hover: 0.4s ease-in-out` to `apps/Frontend/src/styles/tokens.css` (leave existing `--motion-nav` and `--color-red` unchanged)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: One shell observer and the DOM/CSS contract from `specs/037-page-entrance-motion/contracts/ui-entrance-motion.v1.md`. Start styles must not apply without the `js` class, so no-JS users stay visible before any page is marked.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create `apps/Frontend/src/scripts/hero-entrance.ts` that queries `[data-hero-entrance]`, `[data-section-reveal]`, and legacy aliases `[data-pf-reveal]`, `[data-cl-reveal]`, `[data-acs-reveal]`, `[data-cb-reveal]`, `[data-ucd-reveal]`; after a double `requestAnimationFrame`, observes with `IntersectionObserver` `threshold: 0.1`; adds `is-visible` once and unobserves (never removes the class); when `prefers-reduced-motion: reduce` matches at init, adds `is-visible` immediately and skips the observer; no-ops when no nodes match
- [X] T003 Load `apps/Frontend/src/scripts/hero-entrance.ts` once from `apps/Frontend/src/layouts/BaseLayout.astro`, and add a tiny inline script in `<head>` that sets `document.documentElement.classList.add('js')` before paint
- [X] T004 Add the shared entrance rules to `apps/Frontend/src/styles/layout.css`: under `html.js` only, `[data-hero-entrance]` and default `[data-section-reveal]` start at `opacity: 0; transform: scale(0.85)` and `.is-visible` ends at `opacity: 1; transform: scale(1)` with `transition: opacity var(--motion-entrance), transform var(--motion-entrance)`; `[data-reveal="rise"]` and the five legacy aliases start at `opacity: 0; transform: translateY(16px)` and end at `opacity: 1; transform: none` over about `0.8s` cubic-bezier; `@media (prefers-reduced-motion: reduce)` forces those markers to the end state with `transition: none` and `animation: none`. Do not use the `hidden` attribute to drive motion

**Checkpoint**: Shell script and CSS contract exist. Unmarked pages stay fully visible. User stories can proceed.

---

## Phase 3: User Story 1 - Every public page heading zooms in like production (Priority: P1) 🎯 MVP

**Goal**: Each public page’s primary heading uses `data-hero-entrance` and the shared 0.6s fade-and-zoom once. Reload repeats it. Scrolling away does not reverse it. `/solutions` is not a special case.

**Independent Test**: With JavaScript, load `/`, `/solutions`, one `/services/...` landing, one `/company/...` listing, and `/contact-us`. The primary `[data-hero-entrance]` heading animates once to opacity 1 and stays revealed. With JavaScript disabled, that `h1` is still readable.

### Tests for User Story 1

- [X] T005 [P] [US1] Add Playwright coverage in `apps/Frontend/tests/e2e/hero-entrance.spec.ts` for `/`, `/solutions`, `/services/application-development-services`, `/company/careers`, and `/contact-us`: the primary `[data-hero-entrance]` gains `is-visible` and computed opacity `1` within about one second of entering view; after scrolling it out of view and back, `is-visible` is still present

### Implementation for User Story 1

- [X] T006 [P] [US1] Add `data-hero-entrance` to the primary banner `h1` in `apps/Frontend/src/components/HomeHero.astro`, `SolutionsHero.astro`, `ServicesHero.astro`, `AboutHero.astro`, `CareersHero.astro`, `AdsHero.astro`, `DigitalTransformationHero.astro`, `LandingHero.astro`, `MadHero.astro`, `AiServicesHero.astro`, `DoctcareHero.astro`, and `CaseStudiesBanner.astro` (do not change heading text or level)
- [X] T007 [P] [US1] Add `data-hero-entrance` to the primary `h1` in `apps/Frontend/src/components/ProcureFlexHero.astro`, `CreditLifeHero.astro`, `ComBusHero.astro`, `AiChatSupportHero.astro`, and `SolutionDetailPage.astro`
- [X] T008 [P] [US1] Add `data-hero-entrance` to the remaining public primary headings, including empty-state fallbacks: `apps/Frontend/src/layouts/PageTemplate.astro`, `ResourcesHubLayout.astro`, `apps/Frontend/src/components/BlogsListing.astro`, `NewsListing.astro`, `ResourcesListing.astro`, `MembershipsSection.astro` (every rendered `h1`), `JobsOpeningsBoard.astro`, `HomeClients.astro` (the non-`home` `h1` only), and the `h1` in `apps/Frontend/src/pages/contact-us.astro`, `404.astro`, `about.astro`, `company/testimonials.astro`, `company/jobs-openings/[slug].astro`, `case-studies/[slug].astro` (both the detail `h1` and the not-found `h1`), `blogs/[slug].astro` (title and not-found `h1` only; keep the body `h1`→`h2` rewrite), `solutions/index.astro` (fallback `h1` only), `services/ai-services.astro` (fallback `h1` only), `software-development-services-in-saudi-arabia.astro`, and `index.astro` (fallback `h1` only)
- [X] T009 [US1] Remove heading observers that add and remove `is-visible`, and drop their `<script>` tags: delete `apps/Frontend/src/scripts/about-hero.ts`, `careers-hero.ts`, `services-hero.ts`, `mad-hero.ts`, `doctcare-hero.ts`, and `ads-hero.ts`; remove inline observers from `SolutionsHero.astro` and `AiServicesHero.astro`; remove only the heading `IntersectionObserver` from `case-studies-listing.ts` and delete `case-study-detail.ts` if it only toggles the heading (remove the script tag from `apps/Frontend/src/pages/case-studies/[slug].astro`). Keep `home-hero.ts` (explore-button layout, not entrance)
- [X] T010 [P] [US1] Delete page-scoped primary-heading zoom rules that fight the shared recipe (including `transition: transform 1.5s`) from `apps/Frontend/src/styles/solutions.css`, `mobile-application.css`, `doctcare.css`, `ai-services.css`, `careers.css`, `about-us.css`, `services.css` (hero `h1` only), `case-studies.css`, `case-study-detail.css`, and `application-development.css` (ads-hero `h1` only). Leave `.services-core-row` directional motion in place

**Checkpoint**: User Story 1 is functional on every public primary heading and testable without US2 or US3.

---

## Phase 4: User Story 4 - Reduced motion and first paint stay accessible (Priority: P1)

**Goal**: `prefers-reduced-motion: reduce` and no-JS show headings and marked sections fully opaque and unscaled, with no nav scale. Motion uses transform and opacity only so it does not shift layout or steal LCP from hero media.

**Independent Test**: Emulate `prefers-reduced-motion: reduce` on `/` and `/solutions` and see opacity 1 immediately. Disable JavaScript and still read the `h1` on home and in-body copy on a product page.

### Tests for User Story 4

- [X] T011 [P] [US4] Add `apps/Frontend/tests/e2e/entrance-reduced-motion.spec.ts` that emulates `prefers-reduced-motion: reduce` on `/` and `/solutions` and asserts `[data-hero-entrance]` computed opacity is `1` without waiting for a transition, and that the entrance `transition-duration` is `0s`
- [X] T012 [P] [US4] Extend `apps/Frontend/tests/e2e/public-no-js.spec.ts` so `/` and `/solutions/procure-flex` render a visible `h1` and visible in-body copy (a ProcureFlex why/quote/feature region) with JavaScript disabled

### Implementation for User Story 4

- [X] T013 [US4] In `apps/Frontend/src/scripts/hero-entrance.ts`, subscribe to `prefers-reduced-motion` changes and add `is-visible` to any still-pending marked nodes so a runtime toggle cannot leave `opacity: 0`. In the existing `@media (prefers-reduced-motion: reduce)` block in `apps/Frontend/src/styles/layout.css`, force `.nav-trigger` and `.nav-link` to `transform: none` (the block already sets `transition`/`animation: none` on nav and `.flyout-panel`)

**Checkpoint**: Reduced-motion and no-JS paths pass on more than one route. Heading text, level, and metadata are unchanged.

---

## Phase 5: User Story 2 - Top navigation motion on every public page (Priority: P2)

**Goal**: Desktop hover turns primary nav labels brand red and scales them to about 1.1 over ~0.4s. Services and Company flyouts keep scale-Y. The header stays on screen while scrolling. The mobile drawer is unchanged.

**Independent Test**: At ≥1024px on `/` and `/contact-us`, hover a primary nav label, open the Services flyout, and scroll about 500px. The header remains in the viewport on both routes.

### Tests for User Story 2

- [X] T014 [P] [US2] Add `apps/Frontend/tests/e2e/header-motion.spec.ts` at viewport width ≥1024 for `/` and `/contact-us`: hovering `.nav-link` or `.nav-trigger` yields color matching `--color-red` (`#e50914`) and transform scale about `1.1`; scrolling ~500px leaves `.site-header` inside the viewport (no `translateY(-100%)`); opening Services still runs the existing `flyout-in` scale-Y animation

### Implementation for User Story 2

- [X] T015 [US2] In `apps/Frontend/src/styles/layout.css`, under `@media (min-width: 1024px) and (hover: hover)`, transition `.nav-trigger` and `.nav-link` color and transform with `var(--motion-nav-hover)` and on `:hover` set `color: var(--color-red)` and `transform: scale(1.1)`. Apply the same colour on `:focus-visible` without requiring scale for keyboard. Do not scale labels below 1024px. Keep `@keyframes flyout-in` (`scaleY(0.4)` → `scaleY(1)`, origin top)
- [X] T016 [US2] In `apps/Frontend/src/scripts/site-header.ts`, stop adding `is-hidden` on scroll-down while still toggling `is-scrolled` for `data-tone="dark"` and still closing flyouts as today. Delete `.site-header.is-hidden { transform: translateY(-100%); }` from `apps/Frontend/src/styles/layout.css`. Do not change mobile drawer open/close behaviour in `SiteHeader.astro`

**Checkpoint**: Header hover, flyout, and pin work on every route that uses `SiteHeader`, independent of in-body reveals.

---

## Phase 6: User Story 3 - In-body sections reveal on scroll (Priority: P2)

**Goal**: Major in-body blocks fade and zoom once with the shared enhancer. Solutions product cards use default zoom. Existing product-page fade-ups use `data-reveal="rise"`. Legacy `data-*-reveal` attributes are migrated. Services core left/right slides stay.

**Independent Test**: On `/solutions`, scroll a product card and see one zoom-in that does not reverse. On `/solutions/procure-flex`, why/quote/feature clusters still reveal once. With JavaScript disabled those sections stay readable.

### Tests for User Story 3

- [X] T017 [P] [US3] Add `apps/Frontend/tests/e2e/section-reveal.spec.ts`: on `/solutions`, a product card or image marked `data-section-reveal` gains `is-visible` once when scrolled into view and keeps it after scrolling away; on `/solutions/procure-flex`, a rise cluster gains `is-visible` once and stays revealed

### Implementation for User Story 3

- [X] T018 [P] [US3] In `apps/Frontend/src/components/SolutionsProducts.astro`, mark each product card or its image with `data-section-reveal` (default zoom, no `data-reveal="rise"`) and mark the section `h2` once; delete the inline observer that removes `is-visible` when the card leaves the viewport. Remove the product-image `1.5s` zoom rules from `apps/Frontend/src/styles/solutions.css` if they remain after T010
- [X] T019 [P] [US3] Migrate ProcureFlex clusters from `data-pf-reveal` to `data-section-reveal` plus `data-reveal="rise"` in `apps/Frontend/src/components/ProcureFlexHero.astro`, `ProcureFlexFeatures.astro`, `ProcureFlexBenefits.astro`, `ProcureFlexWhy.astro`, `ProcureFlexQuote.astro`, `ProcureFlexShowcase.astro`, and `ProcureFlexCaseStudy.astro`. Mark the cluster once when a parent and child would both animate. Delete the reveal-only observer from `apps/Frontend/src/scripts/procure-flex.ts` and the duplicate `[data-pf-reveal]` rules from `apps/Frontend/src/styles/procure-flex.css` (keep reduced-motion visibility if the shared CSS does not already cover it)
- [X] T020 [P] [US3] Migrate Credit Life clusters from `data-cl-reveal` to `data-section-reveal` and `data-reveal="rise"` in `apps/Frontend/src/components/CreditLifeHero.astro`, `CreditLifeBenefits.astro`, `CreditLifeFeatures.astro`, `CreditLifeQuote.astro`, `CreditLifeWhy.astro`, `CreditLifeStakeholders.astro`, and `CreditLifeShowcase.astro`. Remove `initCreditLifeReveal` from `apps/Frontend/src/scripts/credit-life.ts` and keep the Swiper showcase. Drop duplicate `[data-cl-reveal]` rules from `apps/Frontend/src/styles/credit-life.css`
- [X] T021 [P] [US3] Migrate ComBus clusters from `data-cb-reveal` to `data-section-reveal` and `data-reveal="rise"` in `apps/Frontend/src/components/ComBusHero.astro`, `ComBusFeatures.astro`, `ComBusTagline.astro`, and `ComBusWhy.astro`. Remove `initComBusReveal` from `apps/Frontend/src/scripts/com-bus.ts` and keep the separate showcase `is-zoomed` behaviour. Drop duplicate `[data-cb-reveal]` rules from `apps/Frontend/src/styles/com-bus.css`
- [X] T022 [P] [US3] Migrate AI Chat Support clusters from `data-acs-reveal` to `data-section-reveal` and `data-reveal="rise"` in `apps/Frontend/src/components/AiChatSupportFeatures.astro`, `AiChatSupportShowcase.astro`, `AiChatSupportQuote.astro`, `AiChatSupportHero.astro`, `AiChatSupportWhy.astro`, and `CoverflowLaptopSlider.astro`. Remove `initAiChatSupportReveal` from `apps/Frontend/src/scripts/ai-chat-support.ts` and keep `initCoverflowShowcase`. Drop duplicate `[data-acs-reveal]` rules from `apps/Frontend/src/styles/ai-chat-support.css`
- [X] T023 [P] [US3] Migrate `[data-ucd-reveal]` to `data-section-reveal` and `data-reveal="rise"` in `apps/Frontend/src/components/UcdApproach.astro` and `DevopsApproach.astro`. Delete `apps/Frontend/src/scripts/ucd-approach.ts` and its script tags. Drop duplicate reveal rules from `apps/Frontend/src/styles/application-development.css` and `devops-consult.css`
- [X] T024 [P] [US3] Add default `data-section-reveal` (zoom, not rise) to major in-body section titles that are not already inside a reveal cluster: the `h2` in `apps/Frontend/src/components/HomeServices.astro`, `HomeCaseStudies.astro`, `HomeClients.astro` (home `h2` only), `HomeMinds.astro`, `HomeInsights.astro`, `HomeFaq.astro`, and `HomeOfferings.astro` when that file has a section heading. Do not mark paragraphs, list items, footer links, or `.services-core-row` nodes
- [X] T025 [US3] Leave the services-core directional slides in `apps/Frontend/src/components/ServicesCore.astro`, `apps/Frontend/src/scripts/services-core.ts`, and the `.services-core-row.is-visible` rules in `apps/Frontend/src/styles/services.css`. Add a short comment in `services-core.ts` that this left/right motion is the documented exception and must still honour reduced motion and no-JS visibility. Do the same for the one-shot pin reveal in `apps/Frontend/src/scripts/about-global.ts` (do not force zoom onto `.about-global-pin`)

**Checkpoint**: Solutions cards zoom once. Product-page clusters still reveal through the shared script. No per-page observer removes `is-visible` on leave.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates from the constitution and quickstart

- [X] T026 [P] Search `apps/Frontend` and remove any remaining primary-heading `1.5s` scale-only rules, `classList.remove('is-visible')` / `classList.toggle('is-visible'` on entrance observers, and leftover `data-pf-reveal`, `data-cl-reveal`, `data-acs-reveal`, `data-cb-reveal`, or `data-ucd-reveal` attributes in `apps/Frontend/src`
- [X] T027 [P] Confirm `apps/Frontend/package.json` has no `gsap`, `framer-motion`, or `lottie` dependency added for this feature
- [X] T028 Run the scenarios in `specs/037-page-entrance-motion/quickstart.md` via the Frontend Playwright suite (`hero-entrance.spec.ts`, `entrance-reduced-motion.spec.ts`, `header-motion.spec.ts`, `section-reveal.spec.ts`, `public-no-js.spec.ts`, plus existing `a11y-public.spec.ts` and `discoverability.spec.ts`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on T001 — blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — no dependency on US2 or US3
- **User Story 4 (Phase 4)**: Depends on Phase 2. Heading assertions in T011 are meaningful after T006–T008. No-JS visibility in T012 is meaningful after T004 and, for in-body copy, after T019
- **User Story 2 (Phase 5)**: Depends on Phase 2. Hover scale should land after T013 so reduced motion still forces `transform: none`
- **User Story 3 (Phase 6)**: Depends on Phase 2 (shared observer and rise/zoom CSS). Independent of US2
- **Polish (Phase 7)**: Depends on the stories you intend to ship

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational. Independently testable
- **User Story 4 (P1)**: After Foundational. Fallback CSS is already in T004; T013 is the runtime listener and nav-scale lock
- **User Story 2 (P2)**: After Foundational and T013. Does not require in-body markers
- **User Story 3 (P2)**: After Foundational. Does not require header hover work

### Within Each User Story

- Playwright specs are written first and fail before implementation
- T009 edits the same hero components as T006 and T007, so it follows those marker tasks
- T016 edits `layout.css` after T015
- Product migrations T019–T023 touch different files and can run in parallel

### Parallel Opportunities

- T006, T007, T008, and T010 can run together after T005 is filed
- T011 and T012 can run together
- T019, T020, T021, T022, T023, and T024 can run together after T017 is filed
- US2 and US3 can proceed in parallel once Phase 2 and T013 are done

---

## Parallel Example: User Story 1

```bash
Task: "Add data-hero-entrance to banner h1 components (T006)"
Task: "Add data-hero-entrance to product heroes (T007)"
Task: "Add data-hero-entrance to listings, layouts, and fallbacks (T008)"
Task: "Delete conflicting 1.5s hero CSS (T010)"
```

## Parallel Example: User Story 3

```bash
Task: "Migrate ProcureFlex reveal clusters (T019)"
Task: "Migrate Credit Life reveal clusters (T020)"
Task: "Migrate ComBus reveal clusters (T021)"
Task: "Migrate AI Chat Support reveal clusters (T022)"
Task: "Migrate UCD/DevOps reveal clusters (T023)"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 and Phase 2 (includes no-JS gating and reduced-motion end state so opacity 0 cannot ship alone)
2. Complete Phase 3 (User Story 1)
3. Stop and validate heading motion on the five IA sample routes
4. Complete Phase 4 (User Story 4) before calling the P1 increment done

### Incremental Delivery

1. Setup + Foundational → shared enhancer loaded on every public page
2. User Story 1 → site-wide heading zoom (MVP)
3. User Story 4 → reduced-motion and no-JS proof
4. User Story 2 → pinned header and desktop hover scale
5. User Story 3 → solutions card zoom and migrated in-body rise
6. Polish → grep gates and full Playwright run from quickstart.md

### Parallel Team Strategy

1. Together: T001–T004
2. Then: one person on US1 markers (T006–T010), another on US4 tests (T011–T012)
3. After T013: one person on header (T014–T016), another on section migrations (T017–T025)

---

## Notes

- [P] tasks use different files and do not depend on incomplete sibling tasks
- Do not add GSAP, Framer Motion, or Lottie
- Do not change heading copy, heading level, or metadata (FR-011)
- Do not add Admin or public HTTP APIs (FR-012)
- Services core left/right rows and about-global pins stay as exceptions; they must remain visible under reduced motion and no-JS
- Commit after each task or logical group using Conventional Commits
