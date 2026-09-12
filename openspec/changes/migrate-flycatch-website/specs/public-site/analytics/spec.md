## Purpose

Retains the measurement the business already relies on by carrying the existing tag management container across to the new site, while preventing tracking scripts from degrading page performance.

## ADDED Requirements

### Requirement: Existing tag management retained

The production tag management container currently deployed on the existing site SHALL be present on the migrated site, so that existing tags, goals, and conversion configuration continue to function.

#### Scenario: Page loaded on production

- **WHEN** a page is loaded on the migrated production site
- **THEN** the existing tag management container loads and its configured tags fire

#### Scenario: Pageview on client-side navigation

- **WHEN** a visitor navigates between pages
- **THEN** a pageview is reported for the destination page with its correct URL and title

### Requirement: Tracking does not block rendering

Analytics and tag management SHALL be loaded so that they do not block first render or the largest contentful paint, and SHALL NOT cause layout shift.

#### Scenario: Page measured with tracking enabled

- **WHEN** a page is measured with tag management active
- **THEN** the page still meets its Core Web Vitals budgets

#### Scenario: Tag manager unavailable

- **WHEN** the tag management endpoint is slow or unreachable
- **THEN** page content still renders and remains interactive

### Requirement: No unnecessary third-party scripts

The site SHALL load only third-party scripts that are required by the business. Scripts present on the production site that serve no current purpose SHALL NOT be carried over.

#### Scenario: Production third-party inventory reviewed

- **WHEN** the third-party scripts on production are inventoried before migration
- **THEN** each is explicitly marked for retention or removal, and only retained ones ship

### Requirement: Analytics excluded from non-production environments

Non-production environments SHALL NOT send data to production analytics properties.

#### Scenario: Page loaded on the development environment

- **WHEN** a page is loaded on a development or staging environment
- **THEN** no event is sent to the production analytics property

### Requirement: Search Console continuity

The migrated production site SHALL remain verifiable in the existing search console property, and its sitemap SHALL be submitted after launch.

#### Scenario: Verification checked after cutover

- **WHEN** site ownership verification is checked after cutover
- **THEN** the existing property remains verified

#### Scenario: Sitemap submitted

- **WHEN** the migration completes
- **THEN** the new sitemap URL is submitted and reports no errors
