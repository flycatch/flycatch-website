## Purpose

Defines how the public website consumes content from the CMS — caching, typing, resilience, and credential boundaries — so that page rendering stays fast and correct without ever exposing CMS credentials to visitors.

## ADDED Requirements

### Requirement: Server-side content access only

Content SHALL be fetched from the CMS by the server during rendering. The browser SHALL NOT be required to call the CMS to display a page's primary content.

#### Scenario: Browser network activity inspected

- **WHEN** a page is loaded and the browser's network activity is inspected
- **THEN** no request to a CMS content endpoint is required for the page's primary content to be visible

### Requirement: No credential exposure

No CMS credential, API token, or administrative endpoint address SHALL be present in any asset delivered to the browser or in any client-readable configuration.

#### Scenario: Delivered assets inspected

- **WHEN** the HTML, JavaScript, and client-readable configuration served to a browser are inspected
- **THEN** they contain no CMS credential or token

#### Scenario: Credential added to client configuration

- **WHEN** a credential is placed in configuration that would reach the browser
- **THEN** the automated checks fail

### Requirement: Caching and revalidation

Content responses SHALL be cached with a defined lifetime and revalidated on a schedule or on publication, so that repeated page renders do not re-query the CMS for unchanged content.

#### Scenario: Repeated renders of unchanged content

- **WHEN** the same page is rendered repeatedly while its content is unchanged
- **THEN** the CMS is queried at most once per revalidation window

#### Scenario: Content published

- **WHEN** an editor publishes a change
- **THEN** the affected pages reflect it within the defined revalidation window without a redeploy

### Requirement: Request efficiency

A single page render SHALL NOT issue duplicate requests for the same CMS resource, and each request SHALL retrieve only the fields and relations the page renders.

#### Scenario: Shared data used by several sections

- **WHEN** multiple sections of one page need the same CMS resource
- **THEN** it is fetched once and reused

#### Scenario: Response payload inspected

- **WHEN** a CMS response used by a page is inspected
- **THEN** it does not contain substantial data the page never renders

### Requirement: Centralized, typed access

All CMS access SHALL go through a single client layer with types derived from the API contract, so that a contract change surfaces as a type error rather than a runtime failure.

#### Scenario: Page needs CMS data

- **WHEN** a page requires content
- **THEN** it obtains it through the shared client layer rather than issuing its own ad hoc request

#### Scenario: API contract changes

- **WHEN** the CMS API contract changes in a way that breaks a consumer
- **THEN** the mismatch is detected by the automated checks before deployment

### Requirement: Graceful degradation

When the CMS is unreachable or returns an error, the site SHALL degrade predictably rather than serving a broken page or a misleading success, and SHALL NOT allow a transient failure to be cached as if it were content.

#### Scenario: CMS unavailable during a page render

- **WHEN** the CMS cannot be reached while rendering a page
- **THEN** the visitor receives a coherent page or an explicit error state, not a partially broken layout

#### Scenario: CMS error on an indexable page

- **WHEN** an indexable page cannot render its primary content because of a CMS failure
- **THEN** the response does not present itself to search engines as successful, indexable content

#### Scenario: Failure not cached as content

- **WHEN** a CMS request fails
- **THEN** the failure response is not stored in the content cache

### Requirement: Safe rendering of CMS HTML

HTML supplied by the CMS SHALL be sanitized before it is rendered, so that stored content cannot inject executable script into a page.

#### Scenario: Content containing script markup

- **WHEN** a CMS record contains executable markup in its body
- **THEN** that markup is not executed when the page renders

### Requirement: Public API exposes only visitor-appropriate data

Endpoints the public site consumes SHALL return only published, visitor-appropriate content. Personal data submitted through forms SHALL NOT be readable without authentication.

#### Scenario: Unpublished record requested

- **WHEN** an unpublished record is requested through a public endpoint
- **THEN** it is not returned

#### Scenario: Form submission data requested

- **WHEN** a contact enquiry or job application record is requested without authentication
- **THEN** it is not returned
