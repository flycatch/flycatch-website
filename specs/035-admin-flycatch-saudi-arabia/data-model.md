# Data Model: Flycatch Saudi Arabia

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| banner_title | string(200) | Required |
| service_section | JSON list | Items: image_key, types_title, contents, links |
| banner_explore_text | string(200) | Default empty |
| services_title | string(200) | Default empty |
| video_key | string(255) | Optional video media key |
| seo | JSON | ContentSeo |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

## Service item

| Field | Type | Rules |
|-------|------|--------|
| image_key | string | Optional image media key |
| types_title | string(200) | Default empty |
| contents | text | Default empty |
| links | string(500) | Default empty |

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `banner_title`, `services_title`, `banner_explore_text` (case-insensitive contains). Newest first.

## List projections

- `service_section`: integer count of items
- `service_section_names`: types titles for the popover
- `video_format`: uppercase file extension of `video_key`, empty if none
