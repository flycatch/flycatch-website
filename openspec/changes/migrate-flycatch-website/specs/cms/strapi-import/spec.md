## Purpose

Moves the website's entire editorial and marketing content out of the legacy Strapi instance and into the project's own CMS, completely and verifiably, so that Strapi can be retired without content or SEO loss.

## ADDED Requirements

### Requirement: Complete content coverage

The import SHALL cover every Strapi collection whose content is published on the production website, mapping each to its corresponding content type in the target CMS.

#### Scenario: Collection count reconciled

- **WHEN** the import completes for a collection
- **THEN** the number of published records in the target CMS matches the number of published entries in Strapi, and any discrepancy is reported

#### Scenario: Collection with no target content type

- **WHEN** a Strapi collection backing a production page has no corresponding content type in the target CMS
- **THEN** the content type is created before the import is considered complete

### Requirement: SEO field migration

The import SHALL carry each Strapi entry's SEO metadata — title, description, canonical URL, social image, and image alternative text — into the corresponding target fields. SEO metadata SHALL NOT be discarded during import.

#### Scenario: Entry with SEO metadata

- **WHEN** a Strapi entry carrying SEO metadata is imported
- **THEN** the resulting record exposes that title, description, canonical URL, social image, and alt text

#### Scenario: Target type lacks SEO storage

- **WHEN** a content type in the target CMS has nowhere to store imported SEO metadata
- **THEN** storage is added before the import runs, rather than the metadata being dropped

### Requirement: Slug preservation

The import SHALL preserve each entry's existing slug exactly, because published URLs are derived from slugs. Slugs SHALL NOT be normalized, re-cased, or regenerated.

#### Scenario: Slug containing uppercase characters

- **WHEN** an entry's Strapi slug contains uppercase characters
- **THEN** the imported record retains that exact slug so its production URL is preserved

#### Scenario: Slug collision

- **WHEN** two entries would produce the same slug in the target CMS
- **THEN** the conflict is reported for resolution rather than silently resolved by appending a suffix

### Requirement: Media migration

Every media asset referenced by imported content SHALL be transferred into the project's own storage, with references rewritten to the new location. Imported content SHALL NOT continue to reference the legacy CMS at runtime.

#### Scenario: Entry with an image

- **WHEN** an entry referencing an image is imported
- **THEN** the image file is stored in the project's storage and the record references the new location

#### Scenario: Media referenced inside rich text

- **WHEN** rich text body content embeds an image
- **THEN** the embedded reference is rewritten to the new location and its alternative text is preserved

#### Scenario: Asset referenced by several entries

- **WHEN** the same asset is referenced by multiple entries
- **THEN** it is transferred once and shared, rather than duplicated per reference

#### Scenario: Asset cannot be fetched

- **WHEN** an asset cannot be retrieved from the legacy CMS
- **THEN** the failure is recorded with the affected entry and the import continues

### Requirement: Rich text conversion

Structured rich text from the legacy CMS SHALL be converted to sanitized HTML preserving paragraphs, headings, lists, quotes, code, links, embedded images, and inline emphasis.

#### Scenario: Formatted body converted

- **WHEN** a body containing headings, lists, links, and emphasis is imported
- **THEN** the converted HTML preserves that structure and formatting

#### Scenario: Unrecognized block encountered

- **WHEN** the converter encounters a block type it does not handle
- **THEN** the occurrence is reported rather than silently discarded

#### Scenario: Unsafe markup

- **WHEN** imported content contains executable or unsafe markup
- **THEN** it is removed during conversion

### Requirement: Relation migration

Relationships between records — authors, categories, industries, technologies, job applications to openings, and links between service and solution pages — SHALL be reconstructed in the target CMS.

#### Scenario: Blog post with author and categories

- **WHEN** a blog post with an author and categories is imported
- **THEN** the imported post is linked to the corresponding author and category records

#### Scenario: Page referencing related pages

- **WHEN** a page that references related detail pages is imported
- **THEN** those links are reconstructed so the rendered page shows its related content

### Requirement: Publication state fidelity

The import SHALL preserve each entry's publication state, so that content unpublished in the legacy CMS is not made publicly visible by the migration.

#### Scenario: Draft entry imported

- **WHEN** an entry that is not published in the legacy CMS is imported
- **THEN** the resulting record is not publicly visible

#### Scenario: Published entry imported

- **WHEN** a published entry is imported
- **THEN** the resulting record is publicly visible

### Requirement: Re-runnable import

The import SHALL be safe to run repeatedly against the same target, updating existing records rather than creating duplicates, so that content can be refreshed before cutover.

#### Scenario: Import run twice

- **WHEN** the import is run a second time with no source changes
- **THEN** no duplicate records are created

#### Scenario: Source entry changed between runs

- **WHEN** an entry changes in the legacy CMS and the import is re-run
- **THEN** the corresponding target record is updated to match

### Requirement: Rehearsal and reporting

The import SHALL support a rehearsal mode that reads and maps content without writing, and every run SHALL produce a report of records created, updated, skipped, and failed, together with any warnings.

#### Scenario: Rehearsal run

- **WHEN** the import runs in rehearsal mode
- **THEN** no records or media are written and the report shows what would have changed

#### Scenario: Run completes with failures

- **WHEN** a run encounters failures
- **THEN** the report identifies each affected entry and the reason

### Requirement: Credential handling

The legacy CMS access token SHALL be supplied through configuration at run time, used only by server-side import execution, and SHALL NOT be committed to the repository or exposed to any browser.

#### Scenario: Repository inspected

- **WHEN** the repository is inspected
- **THEN** it contains no legacy CMS token

#### Scenario: Token required but absent

- **WHEN** the import is run without the required token configured
- **THEN** it fails with a clear message rather than silently importing partial content
