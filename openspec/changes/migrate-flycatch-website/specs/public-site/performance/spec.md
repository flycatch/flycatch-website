## Purpose

Establishes the rendering, caching, and client-weight behaviour required for the migrated site to load substantially faster than the existing production site and to meet Core Web Vitals as a production requirement.

## ADDED Requirements

### Requirement: Content present in server-rendered HTML

The primary content of every indexable page — headings, body copy, and links that matter for search — SHALL be present in the initial HTML response. The site SHALL NOT depend on client-side rendering to populate content that search engines must see.

#### Scenario: Page fetched without executing JavaScript

- **WHEN** a page is fetched and its raw HTML is inspected without executing scripts
- **THEN** the page's headings, main body content, and internal links are present

#### Scenario: Browsing with JavaScript disabled

- **WHEN** a visitor browses the site with JavaScript disabled
- **THEN** content is readable and navigation between pages works

### Requirement: Cacheable responses

HTML responses SHALL be cacheable by a CDN and revalidated on a defined schedule or on content change. Responses SHALL NOT be served with directives that prevent all caching.

#### Scenario: Page response inspected

- **WHEN** a public page response is inspected
- **THEN** its caching directives permit shared caching, and do not contain `no-store`

#### Scenario: Content changed in the CMS

- **WHEN** an editor publishes a change
- **THEN** the affected pages reflect the change within the defined revalidation window without a redeploy

#### Scenario: Repeated requests for unchanged content

- **WHEN** the same page is requested repeatedly while its content is unchanged
- **THEN** the CMS is not queried on every request

### Requirement: Core Web Vitals budgets

The site SHALL meet, at the 75th percentile on mobile: Largest Contentful Paint at or below 2.5 seconds, Interaction to Next Paint at or below 200 milliseconds, and Cumulative Layout Shift at or below 0.1. Time to First Byte for a cached page SHALL be at or below 600 milliseconds.

#### Scenario: Key templates measured

- **WHEN** the home page, a service page, a case study, and a blog post are measured under a mobile profile
- **THEN** each meets the LCP, INP, CLS, and TTFB budgets

#### Scenario: Measured against the production baseline

- **WHEN** the new site is compared against the captured production baseline for the same pages
- **THEN** load performance is measurably improved

#### Scenario: Budget regression

- **WHEN** a change causes a template to exceed a budget
- **THEN** the automated performance check fails

### Requirement: Client JavaScript budget

The site SHALL ship only the client-side JavaScript required for interactive behaviour, within a declared budget that is enforced automatically. Server-rendered output SHALL be preferred over client-side interactivity wherever the behaviour allows.

#### Scenario: Budget enforced in the pipeline

- **WHEN** the automated checks run
- **THEN** the client JavaScript budget is evaluated and a build exceeding it fails

#### Scenario: Budget reflects reality

- **WHEN** the declared budget is compared with what the site actually ships
- **THEN** the declared budget is accurate rather than aspirational

### Requirement: Font loading

Fonts SHALL be self-hosted, limited to the weights and character ranges the site actually uses, and loaded so that text remains visible during font load without causing layout shift.

#### Scenario: Page rendered during font load

- **WHEN** a page is rendered before its fonts have finished loading
- **THEN** text is visible and no layout shift occurs when the fonts arrive

#### Scenario: Unused weights

- **WHEN** the loaded font weights are compared with the weights the site's styles reference
- **THEN** no unused weight is loaded

### Requirement: Efficient CMS data access

A page render SHALL NOT issue duplicate requests for the same CMS data, and SHALL request only the fields and relations it renders.

#### Scenario: Page render inspected

- **WHEN** the CMS requests issued during a single page render are inspected
- **THEN** no two requests fetch the same resource, and no request returns data the page does not use
