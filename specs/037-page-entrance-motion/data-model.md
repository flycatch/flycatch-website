# Data Model: Public Page Entrance Motion

Frontend-only. No database tables, CMS fields, or API payloads.

## HeroEntrance

Represents the **primary heading on every public page** (banner title when present, otherwise the page `h1`).

| Field | Type | Rules |
| --- | --- | --- |
| element | HTML heading (usually `h1`) | Must remain in the document for SEO; one primary heading per page unchanged |
| marker | `data-hero-entrance` | Required on every public primary heading that exists |
| state | `pending` \| `revealed` | Starts `pending` unless reduced-motion or no-JS fallback |
| startOpacity | `0` | CSS start |
| startScale | `0.85` | CSS start |
| endOpacity | `1` | Revealed |
| endScale | `1` | Revealed |
| duration | `0.6s` | `ease-out` |
| once | `true` | Never return to `pending` after `revealed` |

### State transitions

```text
[page load, motion OK] → pending
pending + intersecting (once) → revealed
pending + prefers-reduced-motion → revealed (immediate)
pending + noscript/no-js CSS → revealed (immediate)
revealed → (terminal)
```

### Validation

- Empty title: no element, no observer
- Must not use `hidden` to drive the animation
- Must not change heading text or level

## SectionReveal

Major in-body cluster (section title, card, media/copy pair).

| Field | Type | Rules |
| --- | --- | --- |
| marker | `data-section-reveal` | Opt-in; not every paragraph |
| recipe | `zoom` (default) \| `rise` | `data-reveal="rise"` selects rise |
| zoom | same numbers as HeroEntrance | Production product images |
| rise | opacity 0 + `translateY(16px)` → none | Existing product-page fade-up |
| once | `true` | Never reverse on leave |

Legacy aliases `data-pf-reveal`, `data-cl-reveal`, `data-acs-reveal`, `data-cb-reveal`, `data-ucd-reveal` MUST map to SectionReveal during migration.

Same state machine as HeroEntrance (`pending` → `revealed`).

## HeaderMotion

Site chrome, not CMS data.

| Field | Rules |
| --- | --- |
| pin | Header remains `position: fixed` at `top: 0` while scrolling |
| hideOnScroll | `false` (remove `is-hidden` translate) |
| navHoverScale | `1.1` at `~0.4s ease-in-out` for desktop pointer hover on primary labels |
| navHoverColor | Brand red (`--color-red` / production `#e50914`) |
| flyout | Existing `scaleY(0.4 → 1)`, origin top |
| theme | Existing `tone-dark` overlay vs `is-scrolled` solid MAY remain |

### Validation

- Mobile drawer behaviour unchanged
- Reduced motion: no nav scale, no flyout animation
