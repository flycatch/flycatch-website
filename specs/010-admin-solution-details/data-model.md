# Data Model: Solution Details

## SolutionDetail

Table: `solution_details`.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| title | string(200) | Required |
| slug | string(128) | Unique, generated from title |
| banner | JSON | image_key, title, sub_title, industry_type |
| introduction | JSON | items[] (title, order ≥ 0, color) plus description, icon_keys[], sub_title, sub_description (HTML), image_key |
| challenges | JSON | items[] (title, order, color) plus description (HTML), image_key, name, position, types[] |
| benefits | JSON | items[] (title, order, color) plus description, types[] |
| solutions_section | JSON | title, image_key, description |
| cta | JSON | title, description, button_name |
| seo | JSON | ContentSeo (`title`, `description`, `canonical_url`, `meta_title`, `h1_tag`, `image_alt`, `image_key`) |
| status | `draft` \| `publish` | Default `draft` |
| created_at / updated_at | timestamptz | |

### Challenge / benefit types

image_key, description HTML, order ≥ 0, title

## Search

Admin `q` matches `title` or `slug`. Public list published only; detail by slug 404 if missing or draft.
