# Data Model: EmailTemplate

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| body | text | Rich text |
| slug | string(128) | Unique |
| template_type | enum | user_notification | admin_notification; API field `type` |
| subject | string(200) | Required |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |



## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `slug`, `subject`, `type` (case-insensitive contains). Newest first unless noted.
