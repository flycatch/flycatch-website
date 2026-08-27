# Data Model: AI Services

## AiService

Table: `ai_services`.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| slug | string(128) | Unique, generated from banner_title |
| banner_title | string(200) | |
| banner_image_key | string(255) | nullable media key |
| introduction_title | string(200) | |
| introduction_description | text | plain description |
| solutions_title | string(200) | |
| solutions_description | text | |
| industry_title | string(200) | |
| industry_description | text | |
| industry_items | JSON | `{title, image_key, order}` |
| ai_expertise_title | string(200) | |
| ai_expertise_image_key | string(255) | nullable |
| ai_expertise_accordion | JSON | `{title, contents HTML, order}` |
| ai_expertise_accordion_description | text | HTML |
| faq_title | string(200) | |
| faq_description | text | |
| seo | JSON | ContentSeo |
| status | `draft` \| `publish` | Default `draft` |
| created_at / updated_at | timestamptz | |

## AiServiceSolution

Table: `ai_service_solutions`. Unique (`ai_service_id`, `solution_id`). `position` ≥ 0.

## Search

Admin `q` matches banner_title, introduction_title, or slug. Public list published only; detail by slug 404 if missing or draft.
