## Purpose

Preserves the lead-generation functionality the existing site depends on — contact enquiries, career applications, newsletter signups, and gated downloads — with validation, abuse protection, and reliable notification.

## ADDED Requirements

### Requirement: Production form coverage

The site SHALL provide a working equivalent of every form present on the production site, including the contact enquiry form, the career application form, the newsletter subscription form, and any gated download request form.

#### Scenario: Production form has no equivalent

- **WHEN** a form present on production has no working equivalent on the new site
- **THEN** the launch gate fails

#### Scenario: Form fields preserved

- **WHEN** a migrated form is compared with its production counterpart
- **THEN** it collects at least the same information, and any removed field has a recorded justification

### Requirement: Submission persistence and notification

A successful submission SHALL be persisted to the CMS and SHALL trigger notification to the configured recipients using the configured email template.

#### Scenario: Valid submission

- **WHEN** a visitor submits a form with valid input
- **THEN** the submission is stored and a notification email is delivered to the configured recipients

#### Scenario: Notification delivery fails

- **WHEN** the submission is stored but notification delivery fails
- **THEN** the submission is not lost, the failure is recorded, and delivery is retried or surfaced to staff

#### Scenario: File attached to an application

- **WHEN** a career application includes a résumé file
- **THEN** the file is stored and associated with the application, and staff can retrieve it

### Requirement: Server-side validation

Every submission SHALL be validated on the server regardless of client-side validation. Invalid submissions SHALL be rejected with a response that identifies which inputs failed.

#### Scenario: Invalid input submitted directly

- **WHEN** a submission with a malformed email address or a missing required field is sent directly to the endpoint
- **THEN** it is rejected and not persisted

#### Scenario: Oversized or disallowed file

- **WHEN** an uploaded file exceeds the permitted size or has a disallowed type
- **THEN** the submission is rejected with a message identifying the problem

### Requirement: Abuse protection

Public submission endpoints SHALL be protected against automated abuse through bot detection and request rate limiting.

#### Scenario: Automated submission flood

- **WHEN** submissions are sent from one source at a rate exceeding the configured limit
- **THEN** further submissions are rejected until the rate falls back within the limit

#### Scenario: Bot submission

- **WHEN** a submission fails bot detection
- **THEN** it is rejected and not persisted or notified

#### Scenario: Legitimate visitor

- **WHEN** a genuine visitor submits a form at a normal rate
- **THEN** the submission succeeds without additional friction beyond the defined protection

### Requirement: Submission feedback

A visitor SHALL receive clear, accessible confirmation of a successful submission, and clear, field-level messaging when a submission fails.

#### Scenario: Successful submission

- **WHEN** a submission succeeds
- **THEN** a success state is displayed and announced to assistive technology

#### Scenario: Failed submission

- **WHEN** a submission fails validation
- **THEN** the visitor's entered values are retained, the failing fields are identified, and the messages are announced to assistive technology

#### Scenario: Submission while the backend is unavailable

- **WHEN** the backend cannot be reached
- **THEN** the visitor is shown an error state rather than a silent failure or an apparent success

### Requirement: Conversion tracking

Successful form submissions SHALL be reportable as conversion events through the site's tag management, without exposing submitted personal data to third parties.

#### Scenario: Submission completed

- **WHEN** a form submission succeeds
- **THEN** a conversion event is available to tag management

#### Scenario: Event payload inspected

- **WHEN** the conversion event payload is inspected
- **THEN** it contains no personal data from the submission
