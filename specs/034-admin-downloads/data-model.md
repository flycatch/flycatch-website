# Data Model: Download

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| name | string(200) | Required |
| company | string(200) | Default empty |
| file_key | string(255) | Required PDF media key |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `name`, `company` (case-insensitive contains). Newest first.
