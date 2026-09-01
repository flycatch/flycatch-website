# Data Model: Opening

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| job_id | string(80) | Required |
| exp_date | date, nullable | Optional |
| role | string(200) | Required |
| slug | string(128) | Unique; from role |
| experience | string(200) | Default empty |
| location | enum | Kochi, Saudi Arabia, Hybrid, Remote |
| job_type | enum | Full-Time, Part-Time, Contract |
| job_status | enum | Opening Soon, Ongoing |
| specialization | enum | Frontend, Backend, DevOps, Testing, BDE, CMS, FullStack, UI/UX, IT Recruiter |
| body | text | Rich text |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |

M2M `opening_applications`. Write uses `application_ids`.

## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `job_id`, `role`, `slug` (case-insensitive contains). Newest first unless noted.
