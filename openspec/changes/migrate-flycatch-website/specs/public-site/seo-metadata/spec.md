## Purpose

Ensures every indexable page presents search engines and social platforms with accurate, unique, per-page metadata derived from the CMS, so that titles, descriptions, canonicals, and share previews are correct across the whole site.

## ADDED Requirements

### Requirement: Unique page title

Every indexable page SHALL emit exactly one `<title>` element whose text is unique across the site and describes that page's content.

#### Scenario: Title emitted per page

- **WHEN** any indexable page is rendered
- **THEN** the HTML contains exactly one non-empty `<title>` element

#### Scenario: Titles are unique

- **WHEN** the titles of all indexable pages are compared
- **THEN** no two pages share the same title

### Requirement: Meta description

Every indexable page SHALL emit a non-empty meta description. Where the CMS record supplies a description it SHALL be used; otherwise a defined per-template fallback SHALL be used.

#### Scenario: CMS description present

- **WHEN** the CMS record for a page supplies an SEO description
- **THEN** that text is emitted as the meta description

#### Scenario: CMS description absent

- **WHEN** the CMS record supplies no description
- **THEN** the template fallback is emitted and the page is still not left without a description

### Requirement: Canonical URL

Every indexable page SHALL emit exactly one canonical link pointing at its own absolute URL on the canonical production origin.

#### Scenario: Canonical is self-referencing

- **WHEN** an indexable page is rendered
- **THEN** it emits one canonical link equal to its own absolute production URL

#### Scenario: Canonical on a non-production environment

- **WHEN** a page is rendered on a non-production environment
- **THEN** the canonical does not point at a non-production host in a way that could be indexed, and the page is marked non-indexable

### Requirement: OpenGraph and Twitter metadata

Every indexable page SHALL emit OpenGraph title, description, URL, type, site name, and image, and Twitter card, title, description, and image. Social titles SHALL NOT duplicate the brand name.

#### Scenario: Share preview requested

- **WHEN** a page URL is shared to a social platform
- **THEN** the platform receives a title, description, and image that describe that specific page

#### Scenario: Brand suffix not repeated

- **WHEN** a social title is generated from a page title that already contains the brand name
- **THEN** the brand name appears at most once in the social title

#### Scenario: Page has no image

- **WHEN** a page's CMS record supplies no social image
- **THEN** the site-wide default social image is used

### Requirement: Robots directives

Pages that must not be indexed SHALL emit an explicit robots directive preventing indexing, and indexable pages SHALL NOT emit a directive that blocks indexing.

#### Scenario: Non-indexable page

- **WHEN** a page such as the 404 page or an unpublished preview is rendered
- **THEN** it emits a robots directive containing `noindex`

#### Scenario: Indexable page

- **WHEN** an indexable page is rendered on production
- **THEN** it emits no directive that would prevent indexing

### Requirement: Metadata sourced from the CMS for dynamic pages

Pages generated from CMS records — blog posts, case studies, service pages, solution pages, news, resources, and job openings — SHALL derive their title, description, canonical, and social metadata from that record's SEO fields.

#### Scenario: Editor updates SEO fields

- **WHEN** an editor changes a record's SEO title or description and publishes it
- **THEN** the corresponding page's metadata reflects the change without a code change

#### Scenario: List page metadata

- **WHEN** an index or listing page is rendered
- **THEN** it uses metadata defined for that page rather than an undifferentiated site-wide default
