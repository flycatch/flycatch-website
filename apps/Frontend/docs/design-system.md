# Flycatch public site design system

This is the standard for all Frontend pages. Reuse these tokens, type roles, spacing, and components. Do not invent per-page palettes, type scales, or button styles unless a design reference requires a documented exception.

**Stack:** native HTML + CSS custom properties in `src/styles/tokens.css` and utilities in `src/styles/layout.css`. Homepage-specific type, section spacing, and component styles use **explicit CSS values** in `src/styles/home.css` (no design-system tokens or CSS variables for those rules). No Tailwind, Mantine, or other UI kits.

## Finalized typography (explicit values)

These sizes and weights are the source of truth for future pages and components. Implement them as literal CSS. Do not map them to `--text-*`, `--font-weight-*`, or other tokens.

**Family:** Poppins, 300 / 400 / 500 / 600 / 700. **Default tracking:** `0.6px`.

### Responsive type (homepage)

All homepage text scales with the viewport using `clamp(min, preferred, max)` in **rem**. Desktop sizes below are the **maximum**. Interpolation follows 360px → 1440px (same slope as the historical scale). Do not use CSS variables for these values.

Copy uses `overflow-wrap: break-word` so type does not force horizontal scroll.

| Role | Max (desktop) | Explicit clamp |
|---|---|---|
| Buttons, legal, copyright, insight time/date, case industry | 16px (1rem) | `clamp(0.8125rem, 0.75rem + 0.2778vw, 1rem)` |
| Nav, footer body/links, Explore, 18px UI | 18px (1.125rem) | `clamp(0.9375rem, 0.875rem + 0.2778vw, 1.125rem)` |
| Lede, service list, service body | 20px (1.25rem) | `clamp(1rem, 0.9167rem + 0.3704vw, 1.25rem)` |
| Footer column headings | 24px (1.5rem) | `clamp(1.125rem, 1rem + 0.5556vw, 1.5rem)` |
| Case / insight headings | 26px (1.625rem) | `clamp(1.125rem, 0.9583rem + 0.7407vw, 1.625rem)` |
| Offering titles, flyout tagline | 32px (2rem) | `clamp(1.5rem, 1.3333rem + 0.7407vw, 2rem)` |
| Section / hero / right service title | 46px (2.875rem) | `clamp(1.75rem, 1.375rem + 1.6667vw, 2.875rem)` |
| CTA band heading | 58px (3.625rem) | `clamp(2rem, 1.4583rem + 2.4074vw, 3.625rem)` |

Preserve current font family, weight, line-height, letter-spacing, color, and hierarchy. Weights stay as previously finalized (buttons 400, section titles 300, and so on).

### Buttons

All homepage buttons (outline `.btn`, dark `.btn-on-dark`, Book a Call `.cta-book-btn`, Know More): **16px / 400** maximum, via the 16px clamp above. Preserve existing colors, min-height, padding, radius, hover (red fill, white label, `-30deg` arrow), and icons.

Footer Subscribe is not `.btn`: **16px / 400** maximum (same clamp). Other footer copy is **300**.

### Homepage header / hero

The hero Explore arrow (`.explore`) scrolls to the **Services** section (`#services`), not Our Offerings.

### Services

| Element | Size | Weight |
|---|---|---|
| Left section title | Keep current (46px) | Keep current (300) |
| Service list | 20px | 400 |
| Active service (list + arrow affordance) | — | 400 |
| Right service title | 46px | 300 |
| Service body | 20px | keep current (300) |
| Know More | 16px | 400 |

### Section titles

Titles such as Services, Case Studies, Clients, Insights, About Us, FAQ: **margin-top: 0**. Keep other title spacing (including Services list `margin-bottom: 24px`).

Homepage sections (except Our Offerings): **padding-top: 50px** and **padding-bottom: 50px**. Our Offerings keeps its previous spacing (`padding-bottom: 0`, no 50px vertical padding).

### Our Minds / About Us

| Element | Viewport | Size | Weight |
|---|---|---|---|
| Statistic number (e.g. 55) | above 1024px | 46px max (`clamp(1.75rem, 1.375rem + 1.6667vw, 2.875rem)`) | 400 |
| Plus (+) | above 1024px | 18px max (`clamp(0.9375rem, 0.875rem + 0.2778vw, 1.125rem)`) | 400 |
| Labels | above 1024px | 14px max (`clamp(0.75rem, 0.7083rem + 0.1852vw, 0.875rem)`) | 400 |
| Statistic number | 1024px and below | 27px max (`clamp(1.375rem, 1.2083rem + 0.7407vw, 1.6875rem)`) | 400 |
| Plus (+) | 1024px and below | 18px max (`clamp(0.9375rem, 0.875rem + 0.2778vw, 1.125rem)`) | 400 |
| Labels | 1024px and below | 11px max (`clamp(0.625rem, 0.5833rem + 0.1852vw, 0.6875rem)`) | 400 |

The sentence “Join us in shaping the future of IT with passion and purpose.” starts on its own line (`.minds-join { display: block }`). Do not change the copy.

**Count-up:** At **1024px and below only**, each statistic counts from 1 to its target (then shows `+`) when the Minds section enters the viewport. Timing is ease-out. `prefers-reduced-motion` jumps to the final value. **Above 1024px**, keep the existing one-at-a-time slide/loop. Do not count-up on desktop.

**Responsive rules (≤1024px):**
- **Contact & Minds images:** Hidden on mobile/tablet (≤1024px). Above 1024px, the existing images remain unchanged.
- **Minds statistics:** Show all 4 stats at once in a 2-column × 2-row grid, placed immediately above the About Us button (title and body stay above the stats).
- **Our Offerings:** Keep 20px gaps between cards. Keep **50px** padding below the offerings section so the last row is not cramped against the next section.

### Case studies

| Element | Size | Weight |
|---|---|---|
| Industry | 16px | keep current (400) |
| Heading | 26px | keep current (400) |
| Description | keep current | 300 |

Preserve card layout, images, 4-line truncation, and the scroll progress circle.

### Insights

| Element | Size | Weight | Color |
|---|---|---|---|
| Time / date | 16px | keep current (400) | `rgba(0, 0, 0, 0.4)` |

Blog label stays red. Preserve card layout and 2-line title clamp.

### Footer

All footer text **font-weight: 300**, except the Subscribe button.

| Element | Size | Weight |
|---|---|---|
| Footer copy (columns, subscribe intro, status) | keep current unless noted | 300 |
| `© 2026 Copyright Flycatch. All rights reserved.` | 16px | 300 |
| Privacy Policy \| Terms & Conditions | 16px | 300 |
| Subscribe button | 16px | 400 |

Preserve footer layout, subscription POST, input, social icons, and breakpoints. On the homepage, the subscribe intro (privacy/content) and the email + Subscribe form use a clear `space-between` / 80px column gap so the two areas do not sit cramped together.

## Sources of truth

| Concern | Source |
|---|---|
| Finalized homepage type, buttons, section padding, footer legal/copyright sizes | This file (explicit values above) + `src/styles/home.css` |
| Tokens still used for chrome (header, shared layout) | `src/styles/tokens.css` |
| Tokens, type roles, spacing, radii, colors, buttons, container, header structure | Figma [AI Services](https://www.figma.com/design/k6nRrDb6bIxaJxy6wYILr2/Flycatch-Website_Revamp-UI?node-id=9717-26580) — desktop frame **1512** wide, content **1192px**, side inset **160px** |
| Homepage layout, interactions, section composition, desktop/mobile behaviour | [https://www.flycatchtech.com/](https://www.flycatchtech.com/) |
| Mobile / tablet | Live site + breakpoints below. The Figma AI page has **no mobile frame**. |

### Type-size conflicts

Figma display sizes are larger than the live homepage at 1920px. Token scale still exists for interior pages:

- Homepage implements the **explicit values in Finalized typography** above (`src/styles/home.css`). Hide `.explore` when it wraps under the hero heading.
- Interior / future Figma pages use **display** roles (`--text-display`, `--text-display-lg`, `--text-display-xl`) unless a rule in Finalized typography applies (buttons 16px / 400, footer legal 16px / 300, and so on).

Do not add a second fluid `--text-*` scale in a page stylesheet. Prefer the explicit px values documented here.

## Typography

**Family:** Poppins (`--font-family-base`), self-hosted via `@fontsource/poppins` as 300 / 400 / 500 / 600 / 700.

**Default tracking:** `0.6px` (`--tracking`) — Figma. Live computed letter-spacing is often `normal`; keep Figma tracking as the system.

**Weights:** Light 300 (headings, ledes, footer copy), Regular 400 (UI, nav, buttons, card titles, service list, statistic numbers).

**Fluid size:** Homepage type uses explicit `clamp(...)` in rem (see **Responsive type**). Token `--text-*` remains for interior pages that still consume `tokens.css`. Do not substitute homepage clamps with those tokens.

| Token | Min (360px) | Max (desktop) |
|---|---|---|
| `--text-14` | 0.75rem (12px) | 0.875rem (14px) |
| `--text-16` | 0.8125rem (13px) | 1rem (16px) |
| `--text-18` | 0.9375rem (15px) | 1.125rem (18px) |
| `--text-20` | 1rem (16px) | 1.25rem (20px) |
| `--text-24` | 1.125rem (18px) | 1.5rem (24px) |
| `--text-25` | 1.125rem (18px) | 1.5625rem (25px) |
| `--text-26` | 1.125rem (18px) | 1.625rem (26px) |
| `--text-32` | 1.5rem (24px) | 2rem (32px) |
| `--text-36` | 1.5rem (24px) | 2.25rem (36px) |
| `--text-46` | 1.75rem (28px) | 2.875rem (46px) |
| `--text-58` | 2rem (32px) | 3.625rem (58px) |
| `--text-60` | 2rem (32px) | 3.75rem (60px) |
| `--text-68` | 2.125rem (34px) | 4.25rem (68px) |
| `--text-88` | 2.25rem (36px) | 5.5rem (88px) |

Roles alias the scale for token consumers: `--text-body` / `--text-ui` → `--text-18`; `--text-meta` → `--text-14`; `--text-lede` → `--text-20`; `--text-card-title` → `--text-32`; `--text-hero` / `--text-section` → `--text-46`; `--text-cta` → `--text-58`; `--text-display` → `--text-60`; `--text-display-lg` → `--text-68`; `--text-display-xl` → `--text-88`.

**Line-height:** keep existing ratios. `--line-height-body` / `--line-height-heading` 1.55; `--line-height-cta` 1.4; `--line-height-nav` 1.5 (27px at 18px); `--line-height-display` 1.333 (80px at 60px).

Body and `.type-*` use `overflow-wrap: break-word` so copy does not force horizontal scroll.

| Role | Class | Size | Weight | Line-height | Use |
|---|---|---|---|---|---|
| Body | `body` | 18px token scale | 400 | 1.55 | Default copy |
| UI / nav | `.type-nav` | 18px token scale | 400 | 1.5 | Header links |
| Meta | `.type-meta` | 14px token scale | 400 | 1.55 | Non-home insight labels |
| Button (home / future standard) | `.btn` | **16px** | **400** | 1.5 | Homepage CTAs |
| Lede | `.type-lede` | 20px | 300 | ~1.55 | Section intros, service body |
| Card title | `.type-card-title` | 32px token scale | 400 | 1.55 | Offering titles |
| Offering title | `.offer-col h3` | 32px token scale | 300 | 1.55 | Homepage offering columns |
| Section | `.type-section` | 46px | 300 | 1.55 | Homepage h2; **margin-top: 0** |
| Display | `.type-display` | 60px token scale | 300 | 1.333 | Interior section titles (Figma) |
| Hero (home) | `.type-hero` | 46px | 400 | 1.55 | Homepage hero |
| Hero (Figma) | `.type-display-lg` | 68px token scale | 300 | 1.55 | Interior heroes |
| CTA band (home) | `.cta-banner h2` | 58px | 300 | 1.4 | Homepage CTA |
| CTA band (Figma) | `.type-display-xl` | 88px token scale | 300 | 1.55 | Interior CTA |
| Footer heading | `.footer-col h2` | 24px | 300 | 1.25 | Footer columns |
| Footer legal / copyright | `.footer-copyright`, `.legal-links` | **16px** | **300** | — | Footer bottom |
| Footer Subscribe | `.footer-subscribe-btn` | **16px** | **400** | — | Footer form only |

## Colors

Figma variables: White `#ffffff`, Black `#000000`, Red `#e50914`.

| Token | Value | Use |
|---|---|---|
| `--color-white` | `#ffffff` | Surfaces, text on dark |
| `--color-black` | `#000000` | Text, dark sections |
| `--color-red` | `#e50914` | Accent, focus, logo |
| `--color-bg` | white | Page |
| `--color-text` | black | Body |
| `--color-muted` | `#4a4a4a` | Secondary text |
| `--color-accent` / `--color-focus` | red | Focus ring, hover accent |
| `--color-border` | `rgba(0,0,0,0.2)` | Dividers, chips |
| `--color-dark` | black | Footer, dark sections |
| `--color-hero` | `#000b18` | Hero fallback |
| `--color-on-dark` | white | Text on dark |
| `--color-muted-surface` | `#f7f7f7` | Clients / insights |
| `--color-contact-surface` | `#f3f3f3` | Homepage contact band (live site) |
| `--color-cta-surface` | `#f2f2f2` | Homepage Book a Call band |
| `--color-media` | `#dddddd` | Image placeholders |
| `--color-overlay` | `rgba(0,0,0,0.78)` | Hero scrim |
| `--color-on-dark-muted` | `rgba(255,255,255,0.75)` | Footer / dark lede |

## Spacing

Figma S-scale (px). Prefer `--s*` over ad-hoc rem.

| Token | px |
|---|---|
| `--s2` | 8 |
| `--s3` | 12 |
| `--s4` | 16 |
| `--s5` | 24 |
| `--s6` | 32 |
| `--s7` | 40 |
| `--s8` | 48 |
| `--s9` | 56 |
| `--s10` | 64 |

`--space-xs` … `--space-2xl` are aliases onto this scale. Section vertical padding: `--section-pad` (80px).

## Radii

Figma R-scale: `--r0` 0, `--r1` 4, `--r2` 8, `--r3` 12, `--r4` 16.

- Header Contact: `--radius-cta` = `--r1`
- Outline / solid buttons: `--radius-btn` = `--r3`
- Chips: `--r4` (pill via large radius)

## Container and layout

- `--container-width: 1192px` (Figma content). `--container-outer: 1512px` (1192 + 160 + 160). Alias `--max-width` → outer.
- Class `.container`: `width: min(100%, var(--container-outer))`, centered, with horizontal inset so inner content is 1192px at the design frame.
- Horizontal padding: `--container-pad` 20px; `--bp-md` 40px (`--s7`); `--bp-xl` 160px (Figma inset).
- `--header-height: 100px` (Figma; live header is 96px).
- Header logo slot: 190×60 (current asset); Figma logo frame 233×60.

Live services column used `max-width: 1280px`. Do not add a second container token; 1192px is the system.

## Breakpoints

Mobile-first. Named in tokens; media queries must use the same pixel values.

| Token | Value | Behaviour |
|---|---|---|
| `--bp-md` | 768px | 2-col grids, case-study split |
| `--bp-nav` | 1024px | Hamburger / right drawer at this width and below |
| `--bp-lg` | 1024px | Desktop hover flyouts, 4-col offerings, 3-col insights |
| `--bp-xl` | 1440px | 160px container inset |

Design frame 1512px is documentation only, not a layout breakpoint.

## Buttons

Keep native `<a class="btn">` (or `<button>`). Optional trailing 24px arrow (`--btn-icon` / `--s5`, `/icon-arrow-right.svg`).

**Outline (default `.btn`)** — Figma Component 38; live “Read more” / “View all insights”:

- Transparent fill, `1px solid currentColor`
- Padding `--s4` `--s7` (16×40)
- Radius `--r3` (12)
- Min-height 59px
- Gap 8px, Poppins **16px / 400**, tracking 0.6px
- Dark sections: `.btn-on-dark` (white border/text)
- Hover (all `.btn` variants): fill `#e50914`, text `#ffffff`, border `#e50914`. Trailing arrow rotates `-30deg` (2 o’clock). SVG arrows use `currentColor`; image arrows invert to white.

**Solid `.btn-solid`:** white fill, black text (on dark CTA band).

**Homepage Book a Call (exception, this section only):** surface `#f2f2f2`. Button `.cta-book-btn` is black, padding 16px 24px, height 90px, width 100%, radius 12px, type **16px / 400**. Hover uses the shared red fill, white label, and `-30deg` arrow.

**Footer subscribe (exception, footer only):** heading 46px / 300. Email field is 56px tall, full width of the form column, 12px radius, `1px solid` white, white fill, padding `0` 16px. `.footer-subscribe-btn` is not `.btn`: full width, black fill, white border, 12px radius, flex centered label plus a white right arrow, type **16px / 400**. All other footer text is **font-weight 300**. Copyright and Privacy Policy | Terms & Conditions are **16px / 300**. On 768px the heading spans the top row; the field sits opposite the privacy description, with the button stacked under the field. Hover uses the shared red fill (`#e50914`), white label, and `-30deg` (2 o’clock) arrow. Footer bottom is copyright, then Privacy Policy | Terms & Conditions, then social icons in one row; social links are 32px circular white badges with 24px black glyphs. Visitor POST `/api/v1/public/subscriptions` stores the email with `active: true`.

**Header Contact `.contact-cta`:**

- Radius `--r1`, padding `--s2` × `--s5` (Figma 8×24)
- Live homepage height is 36px (`--header-cta-height`) with 18px horizontal padding
- Inverse on `.tone-light`

## Cards

- **Offerings:** full-bleed column grid, 1px `--color-border`, padding `--s7`, desktop min-height 780px, 4 columns from `--bp-lg`. ≤1024px: clean card/grid layout with 20px gap, 20px side spacing, and `16px` radius. Title top margin is equal to its current bottom margin (`0.83em`).
- **Services:** image 16/10, hover scale 1.04 / 0.45s, outline CTA.
- **Insights:** image height 244px, “Blog” label 16px red, time/date **16px / 400** at `rgba(0, 0, 0, 0.4)`, title 26px Regular clamped to 2 lines, category chips. The section CTA is centered in this section only.
- **Case studies:** stacked on small screens; two-column split from 768px. Homepage shows the latest 3 from the Home/case-study API. Industry **16px / 400**, heading **26px / 400**, description **font-weight 300**. “View all works” is a circular control to the left of the cards; a red stroke draws around the grey ring in step with section scroll.

No drop shadows on content cards. Mega/drop menus use `--shadow-menu`.

## Header and navigation

- Height 100px; absolute over dark heroes (`.tone-dark`); white bar + border on `.tone-light`.
- Desktop above `--bp-nav` (1024px): `.primary-nav` flex; `.nav-cluster` gap `--s9` (56px); `--s10` (64px) before Contact. Hover flyouts from `--bp-lg`.
- ≤1024px: hamburger 40px. Opens a right drawer that covers the toggle; close (X) lives in the drawer. Nested panels for Services and Company.
- Nav type: `--text-18` Regular, tracking 0.6px.
- The hero Explore control links to `#services`.
- Invert logo on `.tone-dark`.

## Future pages

1. For type sizes and weights listed under **Finalized typography**, use explicit CSS values. Do not introduce tokens or CSS variables for those rules.
2. Prefer `.container`, `.section`, `.type-*`, `.btn`.
3. Map Figma 60/68/88 headings to `.type-display` / `.type-display-lg` / `.type-display-xl` unless a finalized explicit value applies.
4. Record exceptions in this file, not in a page-local spec.
