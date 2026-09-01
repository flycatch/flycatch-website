# Data Model: Subscription

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| email | string(200) | Required; valid email; unique |
| active | boolean | Default false |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`
- `active` is independent of `status`

## Search

Admin list `q` matches `email` (case-insensitive contains). Newest first.
