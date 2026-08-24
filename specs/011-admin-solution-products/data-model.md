# Data Model: Solution Products

## SolutionProduct

Table: `solution_products`.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID | Primary key |
| product_title | string(200) | Required |
| product_description | text | Default empty |
| product_tag | string(120) | Default empty |
| product_logo_key | string, nullable | Media key |
| product_card_image_key | string, nullable | Media key |
| product_banner_image_key | string, nullable | Media key |
| card_image_on_right | boolean | Default false |
| banner_image_on_right | boolean | Default false |
| slug | string(128) | Unique, from product title |
| order | integer | ≥ 0, default 0 |
| status | `draft` \| `publish` | Default `draft` |
| created_at / updated_at | timestamptz | |

## Search

Admin `q` matches `product_title`, `product_tag`, or `slug`. Public list published only ordered by `order` then `created_at`. Detail by slug 404 if missing or draft.
