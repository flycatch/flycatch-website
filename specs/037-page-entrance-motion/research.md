# Research: Public Page Entrance Motion

**Feature**: `037-page-entrance-motion`  
**Date**: 2026-09-28  
**Status**: Complete — Technical Context items resolved

Reference: production [https://www.flycatchtech.com/solutions](https://www.flycatchtech.com/solutions) (Next.js + Mantine). This app is Astro static HTML in `apps/Frontend`.

---

## 1. Production heading recipe

**Decision**: Copy the production banner `zoomIn` CSS, not the local 1.5s scale-only variant.

Production (hashed class names on 2026-09-28):

- Start: `opacity: 0; transform: scale(0.85); transition: opacity 0.6s ease-out, transform 0.6s ease-out`
- Revealed class (`banner_zoomIn`): `opacity: 1; transform: scale(1)`
- Same pattern on About (`aboutUs_zoomIn`) and Home banner title/scroll control (`home_zoomIn`)

**Rationale**: Follow-up clarified this is the **entire public app**. Production `/solutions` is only the measured recipe. Local pages already diverge (scale-only 1.5s, matching 0.6s copies, or no motion). One shell-level primitive is the only way to cover listings, products, contact, 404, and future routes.

**Alternatives considered**:

- Keep 1.5s cubic-bezier scale-only: fails visual parity
- GSAP/SplitText: heavier, violates native-first and performance
- CSS `@starting-style` only: weak no-JS story and uneven browser support vs observer + noscript

---

## 2. When to add the revealed class

**Decision**: IntersectionObserver, threshold ~0.1, **add once, never remove**. Double `requestAnimationFrame` before observing so the start state paints first.

**Rationale**: Production leaves `zoomIn` on after it is applied. Local heroes that `classList.remove('is-visible')` on leave reverse the zoom, which production does not. Observing immediately in the same frame as script parse can skip the start state (class applied before first paint).

**Alternatives considered**:

- Timeout (e.g. 100ms): ignores below-fold titles
- Remove on leave: fights production and looks like a bug
- CSS animation on load only: misses titles that start off-screen

---

## 3. Shared primitive vs per-page copies

**Decision**: One CSS block in `layout.css` plus `apps/Frontend/src/scripts/hero-entrance.ts` loaded from the **site shell**. Mark every public primary heading with `data-hero-entrance`. Delete duplicated observers. New pages inherit motion if they use `SiteHeader`/`BaseLayout` and mark the `h1`.

**Rationale**: Divergent recipes caused the gap. Site-wide scope fails if implementers only touch Solutions CSS.

**Alternatives considered**:

- Keep per-page CSS: already drifted
- Astro component wrapping every H1: more markup churn than a data attribute

---

## 4. No-JS and reduced motion

**Decision**: Default CSS is the **start** state. `noscript` stylesheet (or `html:not(.js)` if we set a class) forces revealed. `prefers-reduced-motion: reduce` forces revealed and `transition/animation: none` for heading and nav scale.

**Rationale**: FR-006/FR-007. `opacity: 0` without fallback fails SEO (I) and a11y (IX). Existing `public-no-js.spec.ts` already requires a visible `h1` on home.

**Alternatives considered**:

- Start at opacity 1 and animate only if JS: cannot show the entrance
- `hidden` attribute for animation: worse for AT and SEO

---

## 5. Top navigation motion

**Decision**:

1. Desktop nav labels: `transition: 0.4s ease-in-out`; hover `color: brand red` and `transform: scale(1.1)` (production `.header_webLink_text`)
2. Keep existing flyout `scaleY(0.4 → 1)` (~0.4s, origin top)
3. **Remove hide-on-scroll globally** (`is-hidden` / `translateY(-100%)`) in `site-header.ts` — one change covers every public page
4. Keep overlay → solid (`is-scrolled`) where it already exists for dark-tone pages when product design still needs a solid bar; do not invent a new scroll theme

**Rationale**: Header is shared chrome. Hover scale is missing everywhere. Hide-on-scroll hides the menu on the whole app.

**Alternatives considered**:

- Keep hide-on-scroll: diverges from the cited production page
- Animate header opacity on first paint: production header is immediately visible; extra fade is not evidenced

---

## 6. Libraries and scope

**Decision**: No new npm dependencies. Frontend-only. No Admin/public API contracts. No Administration-FE client generation.

**Rationale**: Constitution II/VI; workspace rule for public API counterparts does not apply (not a content Admin API).

**Alternatives considered**: View Transitions API — production does not use it for this cue; out of spec.

---

## 7. Test approach

**Decision**: Extend Playwright in `apps/Frontend/tests/e2e/`:

- Sample `/`, `/solutions`, one `/services/...` landing, one `/company/...` listing, `/contact-us` for heading reveal
- `/solutions` product card and one product page (ProcureFlex or Credit Life) for in-body reveal
- Reduced-motion and no-JS on more than one of those routes
- Header pin + hover on two different routes

**Rationale**: Motion is user-visible; unit tests on class toggling are optional helpers, e2e proves parity.

---

## 8. In-body section reveals (feasible)

**Decision**: Same observer, second marker.

- Default `data-section-reveal`: **same zoom as production** (`solutions_zoom_image` — opacity 0 + scale 0.85, 0.6s ease-out). Use for solutions product images/cards, section `h2`s, and new marks.
- Optional `data-reveal="rise"`: keep current product-page fade-up (`translateY(16px)`, ~0.8s cubic-bezier). Alias or replace `data-pf-reveal`, `data-cl-reveal`, `data-acs-reveal`, `data-cb-reveal`, `data-ucd-reveal`.
- One-shot; no reverse on leave (today solutions products and several heroes reverse — that is a bug vs production).
- Do **not** auto-mark every paragraph.
- Keep services core left/right slides as a documented exception.

**Rationale**: User asked to include in-body motion if possible. Production already zooms product images with the banner recipe. Local product pages already have fade-up clusters; dropping them would regress. Two recipes in one script is still native-first and cheaper than a library.

**Alternatives considered**:

- Leave per-page reveal scripts: continues drift
- Zoom only, delete fade-up: possible visual change on product pages
- Animate all `section > *`: payload of observers, a11y risk, CLS-ish opacity traps


**Rationale**: Motion is user-visible; unit tests on class toggling are optional helpers, e2e proves parity.
