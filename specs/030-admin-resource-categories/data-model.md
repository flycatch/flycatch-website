# Data Model: ResourcesCategory

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| name | string(120) | Required |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |



## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `name` (case-insensitive contains). Newest first unless noted.
