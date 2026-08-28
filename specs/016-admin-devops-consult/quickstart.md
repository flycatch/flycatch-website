# Quickstart: DevOps Consult

## Prerequisites

Database migrated through revision `024`. Staff user with `devops_consult.read` and `devops_consult.create`.

## Validate

1. `GET /api/v1/admin/devops-consult` — 200, `per_page` 10.
2. `POST` with banner title — 201, draft, slug generated.
3. `PATCH` with `status: publish`.
4. `GET /api/v1/public/devops-consult/{slug}` — 200, no `status`.
5. Draft slug returns 404 on public detail.

See [contracts/admin-devops-consult.v1.yaml](./contracts/admin-devops-consult.v1.yaml) and [contracts/public-devops-consult.v1.yaml](./contracts/public-devops-consult.v1.yaml).
