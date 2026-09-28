# Contract: UI entrance motion v1

Not an HTTP API. No OpenAPI file. No Administration-FE client generation.

This contract is the DOM/CSS interface for the **entire public Frontend**. Solutions is not a special route.

## Heading

| Token | Value |
| --- | --- |
| Attribute | `data-hero-entrance` |
| Revealed class | `is-visible` |
| Start | `opacity: 0; transform: scale(0.85)` |
| End (`.is-visible`) | `opacity: 1; transform: scale(1)` |
| Transition | `opacity 0.6s ease-out, transform 0.6s ease-out` |
| Observer | IntersectionObserver, `threshold: 0.1`, add class once |
| No-JS | Heading readable at end visual |
| Reduced motion | End visual, `transition: none` |

Pages MUST NOT ship a primary `h1` without this marker. The enhancer script MUST load from the site shell once.

## Section

| Token | Value |
| --- | --- |
| Attribute | `data-section-reveal` |
| Optional | `data-reveal="rise"` |
| Default (zoom) | Same start/end/transition as Heading |
| Rise | `opacity: 0; transform: translateY(16px)` → `opacity: 1; transform: none` |
| Revealed class | `is-visible` (same observer) |
| Legacy aliases | `data-pf-reveal`, `data-cl-reveal`, `data-acs-reveal`, `data-cb-reveal`, `data-ucd-reveal` |

Do not mark every paragraph. Exception: services core directional slides MAY keep their own CSS if reduced-motion/no-JS still show content.

## Header

| Token | Value |
| --- | --- |
| Scroll hide | Forbidden (`transform: translateY(-100%)` on `.site-header` MUST NOT apply during scroll) |
| Nav hover | `color` → brand red; `transform: scale(1.1)`; `transition` ~ `0.4s ease-in-out` |
| Flyout | Existing `flyout-in` keyframes preserved |

## Non-goals (not in this contract)

- Content JSON, public `/api/v1` routes, admin CRUD
- Auto-animating unmarked paragraphs, list items, or footer links
- Split-text, parallax, or scroll-scrubbed timelines
