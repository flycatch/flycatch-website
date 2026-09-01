# Data Model: Application

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| resume_key | string, nullable | Object-storage key |
| name | string(120) | Required |
| last_name | string(120) | Required |
| email | string | Valid email |
| phone | string(40) | Default empty |
| opened | boolean | Default false |
| current_ctc | number | >= 0 |
| expected_ctc | number | >= 0 |
| notice_period | number | >= 0 |
| experience | number | >= 0 |
| additional_info | text | Default empty |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

Many-to-many with Opening via `opening_applications`. List `openings` is related job ids/roles. `resume_format` is derived.

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `name`, `last_name`, `email` (case-insensitive contains). Newest first unless noted.
