# Design deviations: home and AI Services

Reviewed against production (`https://www.flycatchtech.com/` and `/services/ai-services`) for task 5.7.

**Review status:** recorded for launch review (tasks 11.6 / 12.3). Not yet signed off by a stakeholder.

Section order on both pages matches production. Remaining differences below are kept only where they improve accessibility, responsiveness, performance, SEO, or conversion.

## Home (`/`)

| Deviation | Production | New site | Justification |
| --- | --- | --- | --- |
| Visible first-level heading | Keyword `h1` (“Custom Software Development Company in Saudi”) is clipped to 1×1px. Banner line is not an `h1`. | Banner title is a visible `h1`. | Accessibility and SEO: one meaningful visible heading (also required by task 6.10). |
| Server-rendered sections and navigation | Marketing chrome is SSR; several interactive blocks hydrate from the client. Nav links are client-rendered. | Headings, body, CTAs, and nav links are in the initial HTML. | SEO and no-JS browsing. |
| Header height and type tracking | Header ~96px; much copy uses normal letter-spacing. | Header 100px; `0.6px` tracking on home type. | Consistency with the shared public-site type system; no content change. |
| Offering hover motion | Four static offering columns. | Same four columns; hover GIF is decorative (`alt=""`). | Responsiveness / conversion: clarifies the offering without changing copy. |
| FAQ block | No FAQ section. | Renders only when the CMS home record has FAQ entries. | SEO: real `FAQPage` content only; empty markup is not emitted. |
| Form chrome on the CTA / footer | Newsletter and Book a Call are JS-driven, not native `<form>`. | Native labelled fields (full form behaviour lands in section 9). | Accessibility. |
| Clients intro wording | “redefine a collaboration” | “redefine collaboration” | Readability; same meaning. |

## AI Services (`/services/ai-services`)

| Deviation | Production | New site | Justification |
| --- | --- | --- | --- |
| Visible first-level heading | Keyword `h1` (“Top AI Development Companies”) is clipped. Banner line is an `h2`. | CMS `banner_title` is a visible `h1`. | Accessibility and SEO (task 6.10). |
| Server-rendered mid-page | Intro, solutions, expertise, and industries are empty without JS. | Those sections are in the initial HTML. | SEO and no-JS browsing. |
| Solution card title | Title stays visible; extra copy appears on hover. | Title stays visible; hover reveals the CMS overlay description only (no duplicate title). | Accessibility / consistency with production, without the Figma-only hide-the-title behaviour. |
| Great-minds presentation | Dark band, four counters (years / projects / customers / associates). | Same four counters and copy; globe is a decorative background. | Performance-neutral visual; stats and labels match production. |
| Great-minds sentence spacing | Missing space after “world.” | Space inserted after the period. | Readability. |
| Insights and Book a Call | Same blocks at the end of the page. | Shared `HomeInsights` / `HomeCta` components. | Consistency across templates. |

## Explicitly not retained from the Figma rework

- AI Services “great minds” used three Figma counters (“Passionate Associates”, 30 / 25 / 60) instead of production’s four.
- Desktop solution cards hid the product name until hover.
- Home years counter displayed `5+` / “Years in IT Industry”; production uses `5` / “Years in IT industry”.
