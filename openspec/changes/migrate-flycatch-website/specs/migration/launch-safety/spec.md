## Purpose

Defines the verification gates that must pass before and after the production cutover, so that replacing the live website does not cost the business its existing search rankings, traffic, or lead flow.

## ADDED Requirements

### Requirement: Production baseline captured

Before cutover, a baseline of the existing production site SHALL be captured, covering its complete URL inventory, per-page metadata, structured data, analytics configuration, form behaviour, and performance measurements for the key templates.

#### Scenario: Baseline captured

- **WHEN** migration preparation begins
- **THEN** the production URL inventory, metadata, structured data, analytics configuration, and performance measurements are recorded and stored for comparison

#### Scenario: Post-launch comparison

- **WHEN** the new site is verified after launch
- **THEN** every check is made against the recorded baseline rather than against assumptions

### Requirement: Pre-launch URL and redirect verification

Before cutover, every URL in the production baseline SHALL be verified against the new site, and every redirect in the redirect map SHALL be verified to resolve in a single hop to a page returning 200.

#### Scenario: Baseline URL fails verification

- **WHEN** any baseline URL neither returns 200 nor redirects to a working replacement
- **THEN** cutover is blocked until it is resolved

#### Scenario: Redirect verified

- **WHEN** each mapped redirect is requested
- **THEN** it returns a permanent redirect reaching its destination in one hop

### Requirement: Pre-launch SEO verification

Before cutover, the new site SHALL be verified for per-page metadata, canonical correctness, structured data validity, sitemap correctness, and robots directives.

#### Scenario: Metadata compared with the baseline

- **WHEN** the new site's page metadata is compared with the baseline
- **THEN** every page has a unique title, a description, and a correct self-referencing canonical, and any intentional difference is recorded

#### Scenario: Structured data validated

- **WHEN** the new site's structured data is validated
- **THEN** it reports no errors

#### Scenario: Sitemap verified

- **WHEN** the sitemap is fetched and each URL requested
- **THEN** every URL returns 200 and none is a redirect or a non-canonical variant

### Requirement: Pre-launch functional verification

Before cutover, internal links, error handling, forms, and analytics SHALL be verified on the new site.

#### Scenario: Site crawled for broken links

- **WHEN** the new site is crawled
- **THEN** no internal link returns 404 and no page returns a server error

#### Scenario: Forms tested end to end

- **WHEN** each form is submitted with valid input
- **THEN** the submission is stored and its notification email is received

#### Scenario: Analytics verified

- **WHEN** pages are loaded with tag management active
- **THEN** pageviews and configured conversion events are observed

#### Scenario: Unknown URL requested

- **WHEN** a URL that does not exist is requested
- **THEN** the response status is 404 and the error page renders correctly

### Requirement: Pre-launch performance verification

Before cutover, the key page templates SHALL be measured and SHALL meet their defined budgets and improve on the production baseline.

#### Scenario: Templates measured

- **WHEN** the home page, a service page, a case study, and a blog post are measured
- **THEN** each meets its budgets and is measurably faster than the corresponding baseline measurement

### Requirement: Non-production environments stay out of the index

From the start of the migration until cutover, and permanently thereafter, every non-production environment SHALL be non-indexable, and this SHALL be asserted automatically.

#### Scenario: Non-production deployment checked

- **WHEN** a non-production environment is checked
- **THEN** it blocks crawling through both its robots file and a response header

#### Scenario: Non-production environment becomes crawlable

- **WHEN** a change would make a non-production environment crawlable
- **THEN** the automated checks fail and the deployment is blocked

### Requirement: Post-launch verification

After cutover, the live site SHALL be verified for redirect behaviour, indexing health, analytics continuity, crawl errors, and field performance, over a defined monitoring period.

#### Scenario: Immediately after cutover

- **WHEN** cutover completes
- **THEN** the redirect map, sitemap, robots file, canonical tags, analytics, and form submissions are re-verified against the live site

#### Scenario: Sitemap resubmitted

- **WHEN** the live site is verified
- **THEN** the sitemap is submitted to the search console and reports no errors

#### Scenario: Monitoring period

- **WHEN** the defined post-launch monitoring period elapses
- **THEN** indexed page counts, crawl errors, organic traffic, field performance, and lead volume are compared against the baseline and any regression is investigated

### Requirement: Rollback capability

A documented means of reverting to the existing production site SHALL be available and SHALL remain available throughout the post-launch monitoring period.

#### Scenario: Critical regression discovered after launch

- **WHEN** a critical regression is found after cutover
- **THEN** the previous site can be restored using the documented procedure

#### Scenario: Legacy CMS retirement

- **WHEN** the legacy CMS is retired
- **THEN** post-launch verification has completed successfully and rollback is no longer required
