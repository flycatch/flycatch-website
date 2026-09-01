# Data Model: News

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| title | string(200) | Required |
| slug | string(128) | Unique from title |
| body | text | Rich text |
| image_key | string, nullable | Image |
| description | text | Default empty |
| button_name | string(120) | Default empty |
| reading_time | integer | >= 0 |
| facebook/linkedin/twitter/instagram/youtube_url | string(500) | Default empty |
| seo | JSON | ContentSeo |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

M2M news_news_categories and news_authors.

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `title`, `slug`, `description` (case-insensitive contains). Newest first unless noted.
