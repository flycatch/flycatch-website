# Data Model: Contact

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| name | string(120) | Required |
| last_name | string(120) | Default empty |
| email | string(200) | Required; valid email |
| country | string(120) | Default empty |
| phone | string(40) | Default empty |
| subject | string(200) | Default empty |
| contact_date | date | Optional |
| details | text | Default empty |
| contact_type | string(120) | Default empty; free text |
| company_name | string(200) | Default empty |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `name`, `last_name`, `email`, `country`, `company_name`, `subject` (case-insensitive contains). Newest first.
