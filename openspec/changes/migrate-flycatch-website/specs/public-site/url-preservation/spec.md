## Purpose

Protects the search equity the existing site has accumulated by keeping its URLs intact through the migration and defining precise redirect behaviour wherever an address must change.

## ADDED Requirements

### Requirement: Production URLs are preserved exactly

The new site SHALL serve content at the exact production path for every indexed URL, including path segment casing. URLs SHALL NOT be renamed for stylistic or architectural preference.

#### Scenario: Mixed-case production path

- **WHEN** a production URL contains uppercase characters in a path segment, such as `/services/devOps-consultation` or `/solutions/flyGrid-ai`
- **THEN** the new site serves that exact path with status 200

#### Scenario: Route relocated during development

- **WHEN** a development route uses a path that differs from production, such as `/about` or `/blogs/<slug>`
- **THEN** it is relocated to the production path before launch

### Requirement: Redirect map

A documented mapping from every production URL to its new URL SHALL exist and be reviewed before launch. Any URL whose address changes SHALL be served by a permanent 301 redirect to a single target that returns 200.

#### Scenario: Changed URL requested

- **WHEN** a production URL that has been replaced is requested
- **THEN** the response is 301 with a `Location` pointing at the replacement, which returns 200

#### Scenario: Redirect chain

- **WHEN** a redirect is followed
- **THEN** it reaches its final destination in a single hop, with no chained or looping redirects

### Requirement: Existing production redirects are inherited

Redirects the production site serves today SHALL continue to resolve on the new site, even where the source URL does not appear in the sitemap, because those URLs may still hold inbound links.

#### Scenario: Service alias requested

- **WHEN** a URL that production redirects to a parent service page, such as `/services/hybrid-cloud` or `/services/data-engineering`, is requested
- **THEN** it resolves to the same destination production sends it to

#### Scenario: Legacy locale prefix requested

- **WHEN** a URL carrying the legacy locale prefix, such as `/en` or `/en/<slug>`, is requested
- **THEN** it resolves to the unprefixed equivalent

#### Scenario: URL served outside the sitemap

- **WHEN** a URL that production returns 200 for but omits from its sitemap is requested
- **THEN** it either returns 200 or redirects to a defined replacement, rather than becoming an unhandled 404

### Requirement: Case variant handling

For any production URL containing uppercase path characters, the lowercase variant SHALL 301 to the canonical mixed-case URL rather than returning 404.

#### Scenario: Lowercase variant of a mixed-case URL

- **WHEN** `/services/devops-consultation` is requested
- **THEN** the response is 301 to `/services/devOps-consultation`

### Requirement: Duplicate URL resolution

Where production serves identical content at more than one address, exactly one address SHALL be canonical and return 200, and every other variant SHALL 301 to it.

#### Scenario: Both casings currently return 200

- **WHEN** two addresses that both returned 200 on production, such as `/solutions/flyGrid-ai` and `/solutions/flygrid-ai`, are requested on the new site
- **THEN** one returns 200 and the other returns 301 to it

### Requirement: Host and scheme canonicalization

Requests to the non-canonical host or to `http` SHALL 301 to the canonical `https` host.

#### Scenario: Apex domain requested

- **WHEN** `https://flycatchtech.com/` is requested
- **THEN** the response is 301 to `https://www.flycatchtech.com/`

#### Scenario: Insecure scheme requested

- **WHEN** `http://www.flycatchtech.com/` is requested
- **THEN** the response is 301 to the `https` equivalent

### Requirement: Trailing slash normalization

The site SHALL serve each URL at exactly one trailing-slash form and redirect the other form permanently, matching production's behaviour of redirecting the trailing-slash form to the form without it.

#### Scenario: Trailing slash requested

- **WHEN** `/contact-us/` is requested
- **THEN** the response is a permanent redirect to `/contact-us`

### Requirement: Correct not-found status

A request for a URL that does not exist, including a dynamic route whose slug matches no published record, SHALL return HTTP 404.

#### Scenario: Unknown path

- **WHEN** a path that matches no route is requested
- **THEN** the response status is 404

#### Scenario: Dynamic route with unknown slug

- **WHEN** a blog, case study, solution, or job opening URL is requested with a slug that matches no published record
- **THEN** the response status is 404, not 200 with a "not found" body
