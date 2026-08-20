# Data Model: Client Testimonials

## ClientTestimonial

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| client_name | string(120) | Required, trimmed |
| title | string(200) | Required, trimmed |
| review | text | Required, trimmed |
| client_designation | string(200) | Default empty |
| client_company | string(200) | Default empty |
| country | string(120) | Default empty |
| image_key | string, nullable | Object-storage media key |
| alt_text | string(200) | Default empty |
| is_clutch_review | boolean | Default false |
| order | integer | Column name `order`; >= 0; default 0 |
| review_link | string(500) | Default empty |
| content_available_in | JSON list | Default `["en"]` |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

No foreign keys. Table: `client_testimonials`.

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `client_name`, `title`, or `review` (case-insensitive contains). Order by `order` ascending, then `created_at` descending.

Public list: `status = publish`, order by `order` ascending, then `created_at` ascending.
