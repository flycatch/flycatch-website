# Flycatch public site design system

This is the standard for all Frontend pages. Reuse these tokens, type roles, spacing, and components. Do not invent per-page palettes, type scales, or button styles unless a design reference requires a documented exception.

**Stack:** native HTML + CSS custom properties in `src/styles/tokens.css` and utilities in `src/styles/layout.css`. No Tailwind, Mantine, or other UI kits.

## Sources of truth

| Concern | Source |
|---|---|
| Tokens, type roles, spacing, radii, colors, buttons, container, header structure | Figma [AI Services](https://www.figma.com/design/k6nRrDb6bIxaJxy6wYILr2/Flycatch-Website_Revamp-UI?node-id=9717-26580) — desktop frame **1512** wide, content **1192px**, side inset **160px** |
| Homepage layout, interactions, section composition, desktop/mobile behaviour | [https://www.flycatchtech.com/](https://www.flycatchtech.com/) |
| Mobile / tablet | Live site + breakpoints below. The Figma AI page has **no mobile frame**. |

### Type-size conflicts

Figma display sizes are larger than the live homepage at 1920px. Both exist as tokens:

- Homepage uses **live** roles (`--text-hero` / `--text-section` → `--text-46`, `--text-cta` → `--text-58`). Hide `.explore` when it wraps under the hero heading.
- Interior / future Figma pages use **display** roles (`--text-display`, `--text-display-lg`, `--text-display-xl`).

Do not add a second scale in a page stylesheet.

## Typography

**Family:** Poppins (`--font-family-base`), loaded as 300 / 400 / 500 / 600 / 700.

**Default tracking:** `0.6px` (`--tracking`) — Figma. Live computed letter-spacing is often `normal`; keep Figma tracking as the system.

**Weights:** Light 300 (headings, ledes), Regular 400 (UI, nav, buttons, card titles).

**Fluid size:** Every `--text-*` scale token is `clamp(min, preferred, max)` in `rem`. Desktop size is the **max** (same as the previous px value). Preferred interpolates from **360px** to **1440px** (`--bp-xl`) so type shrinks smoothly on smaller viewports. Do not add per-page `font-size` media queries.

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

Roles alias the scale: `--text-body` / `--text-ui` → `--text-18`; `--text-meta` → `--text-14`; `--text-lede` → `--text-20`; `--text-card-title` → `--text-32`; `--text-hero` / `--text-section` → `--text-46`; `--text-cta` → `--text-58`; `--text-display` → `--text-60`; `--text-display-lg` → `--text-68`; `--text-display-xl` → `--text-88`.

**Line-height:** keep existing ratios. `--line-height-body` / `--line-height-heading` 1.55; `--line-height-cta` 1.4; `--line-height-nav` 1.5 (27px at 18px); `--line-height-display` 1.333 (80px at 60px).

Body and `.type-*` use `overflow-wrap: break-word` so copy does not force horizontal scroll.

| Role | Class | Size token | Weight | Line-height | Use |
|---|---|---|---|---|---|
| Body | `body` | `--text-18` | 400 | 1.55 | Default copy |
| UI / nav | `.type-nav` | `--text-18` | 400 | 1.5 | Header links |
| Meta | `.type-meta` | `--text-14` | 400 | 1.55 | Insight labels, legal |
| Button | `.btn` | `--text-18` | 400 | 1.5 | Outline / solid CTAs |
| Lede | `.type-lede` | `--text-20` (home) / `--text-25` (Figma intro) | 300 | ~1.55 | Section intros |
| Card title | `.type-card-title` | `--text-32` | 400 | 1.55 | Insight / offering titles |
| Offering title | `.offer-col h3` | `--text-32` | 300 | 1.55 | Homepage offering columns |
| Section | `.type-section` | `--text-46` | 300 | 1.55 | Homepage h2 |
| Display | `.type-display` | `--text-60` | 300 | 1.333 | Interior section titles (Figma) |
| Hero (home) | `.type-hero` | `--text-46` | 400 | 1.55 | Homepage hero |
| Hero (Figma) | `.type-display-lg` | `--text-68` | 300 | 1.55 | Interior heroes |
| CTA band (home) | `.cta-banner h2` | `--text-58` | 300 | 1.4 | Homepage CTA |
| CTA band (Figma) | `.type-display-xl` | `--text-88` | 300 | 1.55 | Interior CTA |
| Footer heading | `.footer-col h2` | `--text-24` | 300 | 1.25 | Footer columns |

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
- Gap `--s2`, Poppins 18 Regular (fluid `--text-18`), tracking 0.6px
- Dark sections: `.btn-on-dark` (white border/text)
- Hover (all `.btn` variants): fill `--color-red`, text `--color-white`, border `--color-red`. Trailing arrow rotates `-30deg` (2 o’clock) with `--motion-nav`. SVG arrows use `currentColor`; image arrows invert to white.

**Solid `.btn-solid`:** white fill, black text (on dark CTA band).

**Homepage Book a Call (exception, this section only):** surface `--color-cta-surface` (`#f2f2f2`). Button `.cta-book-btn` is black, padding `--s4` `--s5` (16×24), height 90px, width 100%, radius `--r3`. Hover uses the shared red fill, white label, and `-30deg` arrow.

**Footer subscribe (exception, footer only):** heading uses `--text-46`. Email field is 56px (`--s9`) tall, full width of the form column, `--r3` radius, `1px solid` white, white fill (`--color-white`), padding `0` `--s4`, text `--color-text`. `.footer-subscribe-btn` is not `.btn`: full width, black fill, white border, `--r3` radius, flex centered label plus a white right arrow. On `--bp-md` the heading spans the top row; the field sits opposite the privacy description, with the button stacked under the field. Hover uses the shared red fill (`--color-red`), white label, and `-30deg` (2 o’clock) arrow. Footer bottom is copyright, then Privacy Policy | Terms & Conditions, then social icons in one row; social links are `--s6` circular white badges (`--radius-chip`) with `--s5` black glyphs. Visitor POST `/api/v1/public/subscriptions` stores the email with `active: true`.

**Header Contact `.contact-cta`:**

- Radius `--r1`, padding `--s2` × `--s5` (Figma 8×24)
- Live homepage height is 36px (`--header-cta-height`) with 18px horizontal padding
- Inverse on `.tone-light`

## Cards

- **Offerings:** full-bleed column grid, 1px `--color-border`, padding `--s7`, desktop min-height 780px, 4 columns from `--bp-lg`.
- **Services:** image 16/10, hover scale 1.04 / 0.45s, outline CTA.
- **Insights:** image height 244px (Figma), “Blog” label `--text-16` red, meta time/date `--text-14`, title `--text-26` Regular clamped to 2 lines, category chips. The section CTA is centered in this section only.
- **Case studies:** stacked on small screens; two-column split from `--bp-md`. Homepage shows the latest 3 from the Home/case-study API. “View all works” is a circular `--radius-chip` control to the left of the cards; a red stroke draws around the grey ring in step with section scroll.

No drop shadows on content cards. Mega/drop menus use `--shadow-menu`.

## Header and navigation

- Height 100px; absolute over dark heroes (`.tone-dark`); white bar + border on `.tone-light`.
- Desktop above `--bp-nav` (1024px): `.primary-nav` flex; `.nav-cluster` gap `--s9` (56px); `--s10` (64px) before Contact. Hover flyouts from `--bp-lg`.
- ≤1024px: hamburger 40px. Opens a right drawer that covers the toggle; close (X) lives in the drawer. Nested panels for Services and Company.
- Nav type: `--text-18` Regular, tracking 0.6px.
- Invert logo on `.tone-dark`.

## Future pages

1. Import nothing new for color/type/space — use `tokens.css` + existing classes.
2. Prefer `.container`, `.section`, `.type-*`, `.btn`.
3. Map Figma 60/68/88 headings to `.type-display` / `.type-display-lg` / `.type-display-xl`.
4. Record exceptions in this file, not in a page-local spec.
