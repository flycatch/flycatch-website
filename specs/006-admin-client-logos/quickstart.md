# Quickstart: Client Logos

## Prerequisites

Database migrated through revision `010`. Staff user with `records.view` and `drafts.save`.

## Validate

1. Sign in and `GET /api/v1/admin/client-logos` — 200, `per_page` 10.
2. `POST /api/v1/admin/client-logos` with `{ "alt_text": "Acme" }` — 201, `status` draft.
3. `PATCH` with `status: publish` — published.
4. `GET /api/v1/public/client-logos` without auth — includes Acme; omits `status`.
5. Draft logos are absent from the public list.

See [contracts/admin-client-logos.v1.yaml](./contracts/admin-client-logos.v1.yaml) and [contracts/public-client-logos.v1.yaml](./contracts/public-client-logos.v1.yaml).
