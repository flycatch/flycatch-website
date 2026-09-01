# Data Model: Membership

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| title | string(200) | Required |
| description | text | Default empty |
| images | JSON list | Each item image_key and optional alt |
| seo | JSON | ContentSeo |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |



## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `title`, `description` (case-insensitive contains). Newest first unless noted.
