# Data Model: Data Analytics & Migration

## DataAnalytic

Table: `data_analytics`.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| page_name | enum | Unique; six allowed values |
| banner_title | string(200) | |
| banner_image_key | string(255) | nullable |
| introduction_title | string(200) | |
| introduction_first_paragraph | text | |
| introduction_second_paragraph | text | |
| accordion | JSON | `{title, contents HTML, order}` |
| offering_image_key | string(255) | nullable |
| offering_title | string(200) | |
| offering_description | text | HTML |
| faq_title | string(200) | |
| faq_description | text | |
| faq_accordion | JSON | `{title, contents HTML, order}` |
| seo | JSON | ContentSeo |
| status | `draft` \| `publish` | Default `draft` |
| created_at / updated_at | timestamptz | |

List columns: ID, Banner Image, Banner Title, Section Title (introduction_title), State.

## Search

Admin `q` matches page_name, banner_title, or introduction_title. Public detail by page_name 404 if missing or draft.
