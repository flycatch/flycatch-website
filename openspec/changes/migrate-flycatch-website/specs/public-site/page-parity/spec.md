## Purpose

Guarantees that the migrated website serves every page the existing production site serves, at the same address and with equivalent content, so that no visitor journey or indexed page is lost in the cutover.

## ADDED Requirements

### Requirement: Production route coverage

The public site SHALL serve a page for every route template present on the production site: home, services index, service detail, solutions index, solution detail, case studies index, case study detail, about, blogs index, blog detail, careers, job openings index, job opening detail, clients, testimonials, resources, memberships, news and events, contact, the Saudi Arabia landing page, privacy policy, and terms and conditions.

#### Scenario: Every production URL resolves

- **WHEN** any of the 139 URLs listed in the production sitemap is requested on the new site
- **THEN** the response status is 200, or 301 to a replacement URL that itself returns 200

#### Scenario: Route template missing

- **WHEN** a production route template has no corresponding page on the new site
- **THEN** the migration is not considered complete and the launch gate fails

### Requirement: Content equivalence with production

Each migrated page SHALL present the same substantive sections, headings, body content, and calls to action as its production counterpart, sourced from the CMS rather than hard-coded, unless a deviation has been explicitly recorded and approved.

#### Scenario: Page content compared against production

- **WHEN** a migrated page is compared against its production counterpart
- **THEN** every substantive section, heading, and call to action on production is present on the new page

#### Scenario: Approved deviation

- **WHEN** a page intentionally differs from production
- **THEN** the deviation is recorded with its justification (accessibility, responsiveness, performance, consistency, conversion, or SEO) before launch

#### Scenario: Content is CMS-sourced

- **WHEN** a page renders content that exists as a CMS record
- **THEN** that content is read from the CMS and not hard-coded in the frontend

### Requirement: Internal links resolve

Every link emitted by site navigation, footer, in-page calls to action, and body content SHALL point to a URL that returns 200 or 301 on the same site.

#### Scenario: Navigation link target missing

- **WHEN** a navigation or footer entry points to a route that does not exist
- **THEN** the entry is either removed or the route is implemented before launch

#### Scenario: Site-wide link crawl

- **WHEN** the site is crawled from the home page
- **THEN** no internal link returns 404

### Requirement: Design fidelity to production

The visual presentation SHALL follow the production site's branding, colour system, typography, navigation structure, and section layout. Where an existing implementation diverges from production, it SHALL be reconciled toward production unless the divergence is an approved improvement.

#### Scenario: Divergent page reconciled

- **WHEN** a page in the repository was built from a design that differs from production
- **THEN** it is reconciled toward the production presentation, retaining only approved improvements

### Requirement: Responsive behaviour across breakpoints

Every page SHALL render correctly at mobile, tablet, laptop, and large-desktop viewport widths, with working navigation, readable typography, intact grids, usable forms, correctly scaled images, and reachable calls to action.

#### Scenario: Page viewed at each breakpoint

- **WHEN** a page is rendered at mobile, tablet, laptop, and large-desktop widths
- **THEN** no content overflows, overlaps, or becomes unreachable, and navigation and forms remain operable

### Requirement: No runtime errors

Loading any page SHALL NOT produce uncaught JavaScript errors, failed asset requests, or server-side exceptions.

#### Scenario: Page loaded with console monitoring

- **WHEN** any page template is loaded
- **THEN** the browser console reports no errors and no request for a page asset fails
