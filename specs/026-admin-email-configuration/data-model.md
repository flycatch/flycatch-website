# Data Model: EmailConfiguration

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| smtp_default_from | email | Required |
| smtp_default_reply_to | email | Required |
| smtp_admin_email | email | Required |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |



## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches the three email fields (case-insensitive contains). Newest first unless noted.
