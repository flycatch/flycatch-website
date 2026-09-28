# Feature Specification: Public Page Entrance Motion

**Feature Branch**: `037-page-entrance-motion`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "there is an animation missing from the actual site here https://www.flycatchtech.com/solutions — most of the pages when the heading like content and top navigation menu there is an animation which completely missing in the current application we have". Follow-up: "this is not for solution page only but for the entire app". Follow-up: "can you consider extra in-body section animations if possible?"

**Constitution alignment**: Native elements first (II) — CSS transitions plus a small observer script, no animation library. Performance and Core Web Vitals (VI, VII) — no extra payload beyond one shared enhancer. Accessibility (IX) — honour `prefers-reduced-motion`. Design consistency (X) — one motion recipe on **every** public page. SEO first (I) — headings remain in the HTML at full size for crawlers; motion is progressive enhancement.

## Scope

This is a **site-wide public frontend** feature, not a Solutions-page fix. Production `/solutions` is only the **visual reference**. Every public route that shows `SiteHeader` MUST get the same top-nav motion. Every public **primary heading** MUST get the same fade-and-zoom. **In-body sections** MUST use a shared reveal (same observer) instead of one-off product scripts.

Production hero/banner and solutions product images: `opacity: 0` + `scale(0.85)` → `opacity: 1` + `scale(1)` over `0.6s ease-out`.

### In scope

- **All** `apps/Frontend` public pages and layouts that render the site header: home, solutions listing and product pages, services index and every service landing, about, careers, jobs, case studies listing and detail, contact, clients, testimonials, blogs listing and detail, news, memberships, resources hub, Saudi Arabia landing, 404, and any page using `PageTemplate` / `ResourcesHubLayout` / `SolutionDetailPage`
- Shared heading entrance on each page’s primary heading (`h1` / banner title)
- **In-body section reveals** on major blocks: section titles (`h2`), product/listing cards, hero-adjacent media/copy pairs, quote/why/feature/benefit clusters that already have local `data-*-reveal` attributes
- One shared enhancer for both hero and section markers; migrate `data-pf-reveal`, `data-cl-reveal`, `data-acs-reveal`, `data-cb-reveal`, `data-ucd-reveal`, solutions product cards, and similar copies
- Top navigation hover scale and colour on the shared header
- Header stays on screen while scrolling (remove hide-on-scroll)
- `prefers-reduced-motion: reduce` and no-JS fallbacks for hero **and** section reveals
- Playwright coverage on a sample of routes across sections, including at least one in-body reveal

### Out of scope

- Administration UI (`apps/Administration-FE`)
- Backend / CMS contracts
- New animation libraries (GSAP, Framer Motion, Lottie)
- Page-to-page view transitions / loading overlays
- Changing copy, imagery, or content APIs
- Animating every paragraph, list item, or footer link automatically
- Split-text / letter-by-letter, parallax, or scroll-scrubbed timelines
- Mobile drawer motion redesign (keep current drawer)
- Unique cinematic exceptions already in production-parity (for example services core rows sliding from left/right) MAY stay; they MUST still honour reduced-motion and no-JS visibility

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every public page heading zooms in like production (Priority: P1)

A visitor opens **any** public page. The primary heading is in the HTML immediately. Once it is in view, it fades and scales from slightly small and transparent to full size and opaque over about 0.6 seconds. Reloading repeats the entrance. Scrolling the heading out of view does **not** reverse it. The same recipe runs on home, listings, service landings, solution products, company pages, contact, 404, and detail routes — not only `/solutions`.

**Why this priority**: The missing cue is site-wide; Solutions was only the example URL.

**Independent Test**: Load at least one page from each IA group (home, solutions, a service, a company listing, contact) with scripting; confirm the primary heading animates once. Disable JavaScript and still read the `h1`.

**Acceptance Scenarios**:

1. **Given** any public page with a primary heading, **When** a visitor loads it with scripting, **Then** that heading animates from opacity 0 and scale 0.85 to opacity 1 and scale 1 in approximately 0.6s ease-out
2. **Given** the heading has already animated, **When** the visitor scrolls it out of the viewport and back, **Then** it stays revealed
3. **Given** scripting is unavailable, **When** a visitor or crawler loads any public page, **Then** the heading is readable at full size
4. **Given** a page that previously used a different recipe (or none), **When** it ships this feature, **Then** it uses the shared marker/script, not a one-off

---

### User Story 2 - Top navigation motion on every public page (Priority: P2)

The shared `SiteHeader` is the only nav implementation. Desktop hover turns a nav label brand red and scales it to about 1.1. Services and Company flyouts keep the existing scale-Y entrance. Scrolling does **not** slide the header off-screen on any route (dark overlay or light solid).

**Why this priority**: Header motion is global chrome; fixing it on one page would still leave the rest of the app wrong.

**Independent Test**: Repeat hover, flyout, and scroll-pin checks on at least two different routes (for example `/` and `/contact-us`).

**Acceptance Scenarios**:

1. **Given** a desktop viewport on any public page, **When** the visitor hovers a primary nav link or trigger, **Then** the label colour shifts to brand red and the text scales to approximately 1.1 over about 0.4s
2. **Given** a desktop viewport on any public page, **When** the visitor opens Services or Company, **Then** the flyout still animates with scale-Y from the top
3. **Given** any public page, **When** the visitor scrolls down, **Then** the header stays in the viewport
4. **Given** a compact viewport, **When** the visitor uses the hamburger menu, **Then** existing mobile drawer behaviour is unchanged

---

### User Story 3 - In-body sections reveal on scroll (Priority: P2)

A visitor scrolls past the hero. Major in-body blocks (section titles, product cards, media/copy pairs, existing product-page reveal clusters) fade and zoom into place once when they enter the viewport, using the same shared enhancer as the hero. Blocks already on screen after load still animate once. Scrolling away does **not** reverse them. Pages that already used `data-pf-reveal` / `data-cl-reveal` / similar keep that behaviour through the shared marker.

**Why this priority**: Production Solutions product images use the same zoom as the banner title. Local product pages already fade-up in-body; unifying them is feasible without a new library.

**Independent Test**: On `/solutions`, scroll product cards and confirm image/card zoom-in once. On a product page (for example ProcureFlex), confirm why/quote/feature clusters still reveal. Disable JS and still read those sections.

**Acceptance Scenarios**:

1. **Given** `/solutions` product cards, **When** a card enters the viewport with scripting, **Then** it (or its image) animates from opacity 0 and scale 0.85 to full using the shared 0.6s ease-out recipe
2. **Given** a product or service page with marked in-body clusters, **When** the visitor scrolls to them, **Then** each cluster reveals once and stays revealed
3. **Given** scripting is unavailable, **When** a visitor reads below the fold, **Then** in-body copy and images are fully visible
4. **Given** `prefers-reduced-motion: reduce`, **When** any marked section is in view, **Then** it is shown in the end state with no transition

---

### User Story 4 - Reduced motion and first paint stay accessible (Priority: P1)

A visitor who prefers reduced motion, or a crawler with no CSS animation, gets revealed headings, revealed in-body sections, and a static header. Motion never hides the only H1 or body copy from assistive tech or search.

**Why this priority**: Constitution IX and I; `opacity: 0` without a fallback is a regression for both hero and sections.

**Independent Test**: Enable `prefers-reduced-motion: reduce` and load several public routes; also inspect HTML without waiting for the observer.

**Acceptance Scenarios**:

1. **Given** `prefers-reduced-motion: reduce`, **When** any public page loads, **Then** the heading and marked sections are fully opaque and unscaled with no transition, and nav hover does not scale
2. **Given** animated start styles use `opacity: 0`, **When** CSS cannot run the reveal, **Then** noscript or reduced-motion fallback still shows the content
3. **Given** the motion enhancer, **When** LCP is measured on a media-hero page, **Then** the hero media remains the LCP candidate and heading/section motion does not introduce layout shift (transform/opacity only)

---

### Edge Cases

- Empty banner title: no heading node, no observer errors
- Heading already in view on load: animation still runs once (rAF/double-rAF or observer fire), not skipped into the end state before paint
- Prefers reduced motion changing at runtime: follow the media query; do not leave opacity 0
- Multiple large titles on one route: the page `h1` uses `data-hero-entrance`; in-body `h2` and major blocks use `data-section-reveal`
- Header flyout open while scrolling: menus close as today; header remains visible
- Nested reveals: prefer marking the cluster once if a parent and child would both animate
- Below-fold sections: reveal when they intersect, not on page load
- Existing directional slides (services core rows): keep if they already match that page’s production motion; do not force zoom onto them

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every public page’s primary heading MUST use one shared entrance: start `opacity: 0` and `transform: scale(0.85)`, end `opacity: 1` and `scale(1)`, `transition: opacity 0.6s ease-out, transform 0.6s ease-out`
- **FR-002**: The revealed state MUST be applied once when the title intersects the viewport and MUST NOT be removed on leave
- **FR-003**: The shared enhancer MUST load from the site shell (`BaseLayout` and/or `SiteHeader`) so **every** public route inherits it without a per-page script copy
- **FR-004**: Shipping a public page without `data-hero-entrance` on its primary heading (when that heading exists) is a defect; `/solutions` is not a special case
- **FR-005**: Implementation MUST be CSS + a small shared script (Intersection Observer). MUST NOT add GSAP, Framer Motion, or similar
- **FR-006**: Without JavaScript, the heading MUST be visible (noscript CSS or equivalent) so SEO and no-JS users are not left at opacity 0
- **FR-007**: `prefers-reduced-motion: reduce` MUST force the revealed visual state and disable heading, section, and nav-scale transitions
- **FR-008**: Desktop primary nav labels MUST transition colour and `scale(1.1)` on hover, matching production (~0.4s ease-in-out), on every page that uses `SiteHeader`
- **FR-009**: The site header MUST remain visible while scrolling on every public page (remove hide-on-scroll translate); existing overlay vs solid theme transitions MAY remain
- **FR-010**: Existing desktop flyout scale-Y animation MUST be preserved
- **FR-011**: Motion MUST NOT change heading text, heading level, or metadata
- **FR-012**: No new Admin or public content APIs; this feature has no CMS counterpart
- **FR-013**: Major in-body blocks MUST use a shared `data-section-reveal` (or equivalent) handled by the same enhancer as FR-003. Default motion MATCHES the hero zoom (`opacity` 0→1, `scale` 0.85→1, `0.6s ease-out`)
- **FR-014**: An optional `data-reveal="rise"` MAY use `translateY(16px)` instead of scale, only to preserve existing product-page fade-up. Implementers MUST NOT invent a third recipe
- **FR-015**: Existing per-page reveal attributes (`data-pf-reveal`, `data-cl-reveal`, `data-acs-reveal`, `data-cb-reveal`, `data-ucd-reveal`, solutions product `is-visible` observers) MUST be migrated to the shared markers or aliased by the shared script
- **FR-016**: Section reveals MUST be one-shot (no reverse on leave). MUST NOT mark every paragraph; target section titles, cards, and existing reveal clusters
- **FR-017**: Without JavaScript, marked sections MUST be visible (same noscript / no-js CSS as the hero)

### Key Entities

- **Hero entrance**: Each public page’s primary heading, start/end transform and opacity, one-shot revealed flag
- **Section reveal**: In-body cluster (title, card, media/copy pair), recipe `zoom` or `rise`, one-shot revealed flag
- **Header motion**: Shared `SiteHeader` hover scale/colour, flyout scale-Y, pinned scroll (not hide)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A sighted tester sees the fade-and-zoom on the primary heading of **every** public IA group (home, solutions, services, company, contact, and a detail/404 sample) within one second of the heading entering view
- **SC-002**: One CSS/script recipe is used site-wide; grep of Frontend MUST NOT find leftover 1.5s scale-only hero recipes or per-page observers that reverse `is-visible`
- **SC-003**: Automated tests prove reduced-motion headings render at opacity 1 without waiting, on more than one route
- **SC-004**: Desktop hover scale works, and scrolling 500px leaves the header in the viewport, on at least two different public routes
- **SC-005**: No additional third-party JS dependency in the Frontend lockfile for this feature
- **SC-006**: On `/solutions`, a product card/image that was off-screen animates into view with the shared zoom; leftover `data-*-reveal` attributes MUST still be honoured or removed after migration
- **SC-007**: Reduced-motion and no-JS still show in-body section copy on a product page sample

## Assumptions

- Production [flycatchtech.com/solutions](https://www.flycatchtech.com/solutions) is the **visual** source of truth; **scope** is the entire public Frontend app
- Heading copy continues to come from published CMS fields; motion is frontend-only
- Hide-on-scroll was a local addition and should be removed globally
- In-body motion is **opt-in via markers** on major blocks, not a global `*` animation
- Existing product-page fade-ups are kept via `data-reveal="rise"` rather than dropped
- Administration-FE is unchanged unless a later request explicitly includes staff UI
