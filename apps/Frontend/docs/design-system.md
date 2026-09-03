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

- Homepage uses **live** roles (`--text-hero`, `--text-section` → 46px).
- Interior / future Figma pages use **display** roles (`--text-display` 60px, `--text-display-lg` 68px, `--text-display-xl` 88px).

Do not add a second scale in a page stylesheet.

## Typography

**Family:** Poppins (`--font-family-base`), loaded as 300 / 400 / 500 / 600 / 700.

**Default tracking:** `0.6px` (`--tracking`) — Figma. Live computed letter-spacing is often `normal`; keep Figma tracking as the system.

**Weights:** Light 300 (headings, ledes), Regular 400 (UI, nav, buttons, card titles).

| Role | Class | Size token | Weight | Line-height | Use |
|---|---|---|---|---|---|
| Body | `body` | `--text-18` | 400 | 1.55 (27.9px) | Default copy |
| UI / nav | `.type-nav` | `--text-18` | 400 | 27px | Header links |
| Meta | `.type-meta` | `--text-14` | 400 | 1.55 | Insight labels, legal |
| Button | `.btn` | `--text-18` | 400 | 27px | Outline / solid CTAs |
| Lede | `.type-lede` | `--text-20` (home) / `--text-25` (Figma intro) | 300 | ~1.55 | Section intros |
| Card title | `.type-card-title` | `--text-32` | 400 | normal | Insight / offering titles |
| Offering title | `.offer-col h3` | `--text-32` | 300 | 1.55 | Homepage offering columns |
| Section | `.type-section` | `--text-46` | 300 | 1.55 (~71px) | Homepage h2 |
| Display | `.type-display` | `--text-60` | 300 | 80px | Interior section titles (Figma) |
| Hero (home) | `.type-hero` | `--text-46` | 400 | 1.55 | Homepage hero |
| Hero (Figma) | `.type-display-lg` | `--text-68` | 300 | normal | Interior heroes |
| CTA band (home) | `.cta-banner h2` | `--text-58` | 300 | 1.4 | Homepage CTA |
| CTA band (Figma) | `.type-display-xl` | `--text-88` | 300 | normal | Interior CTA |
| Footer heading | `.footer-col h2` | `--text-24` | 300 | 30px | Footer columns |

Scale tokens: `--text-14` 16 18 20 24 25 26 32 36 46 58 60 68 88.

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
| `--bp-lg` | 1024px | Desktop nav, 4-col offerings, 3-col insights |
| `--bp-xl` | 1440px | 160px container inset |

Design frame 1512px is documentation only, not a layout breakpoint.

## Buttons

Keep native `<a class="btn">` (or `<button>`). Optional trailing 20px arrow (`/icon-arrow-right.svg`).

**Outline (default `.btn`)** — Figma Component 38; live “Read more” / “View all insights”:

- Transparent fill, `1px solid currentColor`
- Padding `--s4` `--s7` (16×40)
- Radius `--r3` (12)
- Min-height 59px
- Gap `--s2`, Poppins 18 Regular, tracking 0.6px
- Dark sections: `.btn-on-dark` (white border/text)

**Solid `.btn-solid`:** white fill, black text (on dark CTA band).

**Header Contact `.contact-cta`:**

- Radius `--r1`, padding `--s2` × `--s5` (Figma 8×24)
- Live homepage height is 36px (`--header-cta-height`) with 18px horizontal padding
- Inverse on `.tone-light`

## Cards

- **Offerings:** full-bleed column grid, 1px `--color-border`, padding `--s7`, desktop min-height 780px, 4 columns from `--bp-lg`.
- **Services:** image 16/10, hover scale 1.04 / 0.45s, outline CTA.
- **Insights:** image height 244px (Figma), meta 14px, title 32px Regular, category chips.
- **Case studies:** stacked on small screens; two-column split from `--bp-md`.

No drop shadows on content cards. Mega/drop menus use `--shadow-menu`.

## Header and navigation

- Height 100px; absolute over dark heroes (`.tone-dark`); white bar + border on `.tone-light`.
- Desktop from `--bp-lg`: `.primary-nav` flex; `.nav-cluster` gap `--s9` (56px); `--s10` (64px) before Contact.
- Mobile: hamburger 40px, full-width dark panel.
- Nav type: 18 Regular, tracking 0.6px.
- Invert logo on `.tone-dark`.

## Future pages

1. Import nothing new for color/type/space — use `tokens.css` + existing classes.
2. Prefer `.container`, `.section`, `.type-*`, `.btn`.
3. Map Figma 60/68/88 headings to `.type-display` / `.type-display-lg` / `.type-display-xl`.
4. Record exceptions in this file, not in a page-local spec.
