# Data Model: Application Modernization

## ApplicationModernization

Table: `application_modernizations`.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| slug | string(128) | Unique, generated from banner_title |
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

No page_name column.

## Search

Admin `q` matches banner_title, introduction_title, or slug. Public detail by slug 404 if missing or draft.
