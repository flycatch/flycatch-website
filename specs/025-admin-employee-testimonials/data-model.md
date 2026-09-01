# Data Model: EmployeeTestimonial

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | PK |
| name | string(120) | Required |
| designation | string(200) | Default empty |
| review | text | Required |
| image_key | string, nullable | Image |
| order | integer | >= 0; column `order` |
| listed | boolean | Publish checkbox |
| publish_date | date, nullable | Optional |
| status | `draft` \| `publish` | Default `draft`; reuse `content_status` |
| created_at | timestamptz | Set on create |



## State

- Create → `draft` unless write payload sets `publish`
- Publish → `publish`
- Unpublish → `draft`

## Search

Admin list `q` matches `name`, `designation`, `review` (case-insensitive contains). Newest first unless noted.
