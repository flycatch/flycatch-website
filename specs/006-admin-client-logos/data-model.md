# Data Model: Client Logos

## ClientLogo

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| colour_logo_key | string, nullable | Object-storage media key |
| white_logo_key | string, nullable | Object-storage media key |
| alt_text | string(200) | Required, trimmed, min length 1 |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

No foreign keys. Table: `client_logos`.

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` filters `alt_text` with case-insensitive contains. Order by `created_at` descending.

Public list: `status = publish`, order by `created_at` ascending.
