# Data Model: Resource

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| image_key | string, nullable | Image |
| reading_time | integer | >= 0 |
| title | string(200) | Required |
| button_name | string(120) | Default empty |
| slug | string(128) | Unique from title |
| pdf_key | string, nullable | PDF |
| seo | JSON | ContentSeo |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

M2M resource_resource_categories.

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `title`, `slug` (case-insensitive contains). Newest first unless noted.
