## Purpose

Defines how images and other media are delivered so that visual content loads quickly on every device and screen density, contributes correct alternative text for accessibility and search, and never causes layout shift.

## ADDED Requirements

### Requirement: Responsive image delivery

Images SHALL be delivered at a size appropriate to the viewport and device pixel ratio, with candidate sources and sizing information supplied so the browser can select the smallest sufficient variant.

#### Scenario: Image rendered on a small viewport

- **WHEN** a content image is rendered on a mobile viewport
- **THEN** the browser downloads a variant sized for that viewport rather than a full-resolution original

#### Scenario: CMS-supplied image

- **WHEN** an image originates from the CMS
- **THEN** it is delivered through the same responsive sizing path as static images

### Requirement: Modern image formats

Images SHALL be served in a modern compressed format when the requesting browser supports one, with a fallback for browsers that do not.

#### Scenario: Browser supporting a modern format

- **WHEN** a browser that advertises support for a modern image format requests an image
- **THEN** the image is served in that format

#### Scenario: Browser without modern format support

- **WHEN** a browser that does not advertise such support requests the image
- **THEN** a widely supported fallback format is served

### Requirement: Explicit dimensions

Every image SHALL declare its intrinsic dimensions or reserve its layout space so that its arrival does not shift surrounding content.

#### Scenario: Page loads over a slow connection

- **WHEN** a page with images loads over a slow connection
- **THEN** content does not shift as images arrive, and the page's Cumulative Layout Shift stays within budget

### Requirement: Loading priority

Images that form the largest contentful element above the fold SHALL be loaded eagerly with high priority and SHALL NOT be lazy-loaded. Images below the fold SHALL be lazy-loaded.

#### Scenario: Hero image

- **WHEN** a page with a hero image is rendered
- **THEN** the hero image is loaded eagerly with raised priority and is not deferred

#### Scenario: Below-the-fold image

- **WHEN** an image appears below the initial viewport
- **THEN** it is lazy-loaded

### Requirement: Alternative text

Every image that conveys meaning SHALL have descriptive alternative text. Purely decorative images SHALL have empty alternative text so assistive technology ignores them.

#### Scenario: Meaningful CMS image

- **WHEN** an image sourced from the CMS conveys content
- **THEN** its alternative text is populated from the CMS alt field and is not empty

#### Scenario: Decorative image

- **WHEN** an image is purely decorative
- **THEN** its alternative text is empty

#### Scenario: Alt text missing in the CMS

- **WHEN** a meaningful image has no alt text in the CMS
- **THEN** the gap is surfaced to editors rather than silently rendering an empty alt attribute

### Requirement: Media caching

Media responses SHALL be cacheable by a CDN and browsers for a long duration, with cache invalidation handled through the media address rather than by disabling caching.

#### Scenario: Media response inspected

- **WHEN** a media response is inspected
- **THEN** it carries caching directives permitting long-lived shared and browser caching

#### Scenario: Media replaced in the CMS

- **WHEN** an editor replaces an asset
- **THEN** visitors receive the new asset rather than a stale cached copy
