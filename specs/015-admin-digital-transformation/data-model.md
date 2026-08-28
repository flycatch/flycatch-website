# Data Model: Digital Transformation

## DigitalTransformation

Table: `digital_transformations`.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| slug | string(128) | Unique, generated from banner_title |
| banner_title | string(200) | |
| banner_image_key | string(255) | nullable |
| banner_tag_line | string(200) | |
| introduction_title | string(200) | |
| introduction_first_paragraph | text | |
| introduction_second_paragraph | text | |
| accordion | JSON | `{title, contents HTML, order}` |
| outcomes_image_key | string(255) | nullable |
| outcomes_title | string(200) | |
| outcomes_description | text | HTML |
| faq_title | string(200) | |
| faq_description | text | |
| faq_accordion | JSON | `{title, contents HTML, order}` |
| seo | JSON | ContentSeo |
| status | `draft` \| `publish` | Default `draft` |
| created_at / updated_at | timestamptz | |

No page_name column.

## Search

Admin `q` matches banner_title, banner_tag_line, or slug. Public detail by slug 404 if missing or draft.
