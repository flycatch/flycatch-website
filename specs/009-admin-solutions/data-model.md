# Data Model: Solutions

## Solution

Table: `solutions`.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| banner_image_key | string, nullable | Object-storage media key |
| banner_title | string(200) | Default empty |
| section_title | string(200) | Default empty |
| seo | JSON | ContentSeo object |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |
| updated_at | timestamptz | Set on write |

No slug. No foreign keys.

## Search

Admin list `q` filters `banner_title` or `section_title` with case-insensitive contains. Order by `created_at` descending.

Public list: `status = publish`, order by `created_at` ascending.
