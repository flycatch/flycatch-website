## Purpose

Defines the JSON-LD and breadcrumb markup the site emits so that search engines can understand page types and site hierarchy, while ensuring the site never claims structured data that misrepresents a page.

## ADDED Requirements

### Requirement: Structured data accuracy

The site SHALL only emit structured data types that accurately describe the page's actual content. A structured data type SHALL NOT be emitted for content the page does not contain.

#### Scenario: Page has no FAQ content

- **WHEN** a page contains no question-and-answer block
- **THEN** no `FAQPage` markup is emitted for that page

#### Scenario: Emitted markup validated

- **WHEN** any page's JSON-LD is validated against schema.org expectations
- **THEN** validation reports no errors and every required property is present

### Requirement: Site-wide entity markup

Every page SHALL emit `Organization` markup describing the company, and `WebSite` markup describing the site.

#### Scenario: Any page rendered

- **WHEN** any page on the site is rendered
- **THEN** its HTML contains `Organization` and `WebSite` JSON-LD

### Requirement: Page type markup

Content pages SHALL emit markup matching their type: `WebPage` for general pages, `BlogPosting` for blog posts, `Article` for case studies, `Service` for service pages, and `FAQPage` where a genuine FAQ block is present.

#### Scenario: Blog post rendered

- **WHEN** a blog post page is rendered
- **THEN** it emits `BlogPosting` markup including headline, publication date, and author

#### Scenario: Case study rendered

- **WHEN** a case study page is rendered
- **THEN** it emits `Article` markup

#### Scenario: Service page rendered

- **WHEN** a service detail page is rendered
- **THEN** it emits `Service` markup describing that service

#### Scenario: Page with a real FAQ block

- **WHEN** a page renders a question-and-answer block from the CMS
- **THEN** it emits `FAQPage` markup whose questions and answers match the rendered content

### Requirement: Breadcrumbs

Pages below the top level SHALL render a visible, semantic breadcrumb trail and emit matching `BreadcrumbList` markup reflecting the page's position in the site hierarchy.

#### Scenario: Deep page rendered

- **WHEN** a page such as a blog post or a service detail page is rendered
- **THEN** a semantic breadcrumb trail is visible and `BreadcrumbList` markup is emitted

#### Scenario: Breadcrumb matches visible trail

- **WHEN** `BreadcrumbList` markup is emitted
- **THEN** its items and their order match the visible breadcrumb trail and each item links to a URL that returns 200

#### Scenario: Top-level page

- **WHEN** the home page is rendered
- **THEN** no breadcrumb trail is required
