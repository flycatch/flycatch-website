## Purpose

Controls how search engines discover and crawl the site, covering sitemap generation from published CMS content and environment-aware crawl directives that keep non-production deployments out of the index.

## ADDED Requirements

### Requirement: Sitemap generated from published content

The production sitemap SHALL be generated automatically from the site's routes and the CMS's published records. It SHALL NOT rely on a hard-coded list of URLs.

#### Scenario: New record published

- **WHEN** an editor publishes a new blog post, case study, news item, resource, or job opening
- **THEN** its URL appears in the sitemap without a code change

#### Scenario: Record unpublished

- **WHEN** a record is moved out of the published state
- **THEN** its URL no longer appears in the sitemap

#### Scenario: Dynamic detail URLs included

- **WHEN** the sitemap is generated
- **THEN** it includes detail URLs for blogs, case studies, solutions, job openings, news, and resources, not only their index pages

### Requirement: Sitemap correctness

Every URL in the sitemap SHALL be an indexable, canonical URL on the production origin that returns 200. The sitemap SHALL NOT contain redirects, 404s, non-canonical variants, or non-indexable pages.

#### Scenario: Sitemap URLs fetched

- **WHEN** every URL in the sitemap is requested
- **THEN** each returns 200 and matches its own canonical

#### Scenario: Non-indexable page excluded

- **WHEN** a page is marked non-indexable
- **THEN** its URL is absent from the sitemap

### Requirement: Sitemap scale

When the sitemap would exceed the format limits for entries or uncompressed size, it SHALL be split into multiple sitemaps referenced by a sitemap index.

#### Scenario: Sitemap grows beyond format limits

- **WHEN** the number of URLs or the file size would exceed the sitemap format limits
- **THEN** the site serves a sitemap index referencing multiple sitemap files

### Requirement: Production robots.txt

On production the site SHALL serve a `robots.txt` that permits crawling of indexable content, disallows administrative and API paths, and references the sitemap's absolute URL.

#### Scenario: Production robots.txt requested

- **WHEN** `/robots.txt` is requested on production
- **THEN** it permits crawling of public content and contains a `Sitemap:` line with the absolute sitemap URL

#### Scenario: Administrative paths

- **WHEN** the production `robots.txt` is inspected
- **THEN** administrative and API paths are disallowed

### Requirement: Non-production environments are not indexable

Every environment other than production SHALL block crawling through both `robots.txt` and a response header, and its pages SHALL carry a `noindex` directive.

#### Scenario: Development environment crawled

- **WHEN** `/robots.txt` is requested on a development, staging, or preview environment
- **THEN** it disallows all crawling

#### Scenario: Development page requested

- **WHEN** any page is requested on a non-production environment
- **THEN** the response includes a robots header directing `noindex` and the page emits a `noindex` directive

#### Scenario: Indexability asserted automatically

- **WHEN** the automated checks run against a non-production deployment
- **THEN** a deployment that is crawlable fails the check
