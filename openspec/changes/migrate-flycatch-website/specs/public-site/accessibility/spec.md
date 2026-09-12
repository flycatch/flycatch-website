## Purpose

Establishes the baseline accessibility the migrated site must meet, so that the SEO-driven changes improve rather than compromise the experience for keyboard and assistive-technology users.

## ADDED Requirements

### Requirement: Semantic document structure

Each page SHALL use semantic landmarks for its header, navigation, main content, and footer, with exactly one main content region.

#### Scenario: Page structure inspected

- **WHEN** a page's structure is inspected by assistive technology
- **THEN** header, navigation, main, and footer landmarks are identifiable and there is exactly one main region

#### Scenario: Skip to content

- **WHEN** a keyboard user begins tabbing from the top of the page
- **THEN** a mechanism to skip directly to the main content is available

### Requirement: Heading hierarchy

Each page SHALL have exactly one first-level heading that describes the page, and subsequent headings SHALL descend in order without skipping levels. Headings SHALL NOT be visually hidden solely to carry keywords.

#### Scenario: Page headings inspected

- **WHEN** a page's headings are inspected
- **THEN** there is exactly one first-level heading and no heading level is skipped

#### Scenario: Hidden keyword heading

- **WHEN** a page carries a visually hidden heading that exists only for search keywords
- **THEN** it is replaced by a visible heading that describes the page

### Requirement: Keyboard operability

All interactive elements SHALL be reachable and operable by keyboard alone, in a logical order, with a clearly visible focus indicator.

#### Scenario: Keyboard-only navigation

- **WHEN** a visitor navigates a page using only the keyboard
- **THEN** every interactive element can be reached and activated, and the focused element is visibly indicated

#### Scenario: Navigation menu opened by keyboard

- **WHEN** a keyboard user opens the site navigation or a flyout menu
- **THEN** focus moves into the menu, the menu can be dismissed from the keyboard, and focus returns to the trigger

#### Scenario: Focus not trapped

- **WHEN** a visitor tabs through a page containing an expandable region
- **THEN** focus is never trapped in a region that cannot be exited by keyboard

### Requirement: Accessible names and labels

Every form control SHALL have a programmatically associated label, and every link and button SHALL have an accessible name that describes its purpose out of context.

#### Scenario: Form control inspected

- **WHEN** a form control is inspected
- **THEN** it has an associated label that assistive technology announces

#### Scenario: Icon-only control

- **WHEN** a control is represented only by an icon
- **THEN** it carries an accessible name describing its action

### Requirement: Colour contrast

Text and meaningful interface elements SHALL meet the applicable minimum contrast ratio against their background.

#### Scenario: Contrast measured

- **WHEN** text and interface elements are measured against their backgrounds
- **THEN** each meets the applicable minimum contrast ratio

### Requirement: Restrained use of ARIA

ARIA attributes SHALL be used only where native semantics cannot express the behaviour, and SHALL NOT contradict or duplicate native semantics.

#### Scenario: ARIA reviewed

- **WHEN** a component's markup is reviewed
- **THEN** any ARIA attribute present is necessary and does not override correct native semantics

### Requirement: Automated accessibility checking

The site SHALL be checked automatically for accessibility violations, and detected violations SHALL fail the automated checks.

#### Scenario: Accessibility check runs

- **WHEN** the automated accessibility check runs against the key page templates
- **THEN** a template with a detected violation fails the check
