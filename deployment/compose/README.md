# Docker Compose

Local and preview stack: Frontend, Administration FE, Backend, PostgreSQL, MinIO, and the Caddy gateway.

**Project overview:** see [README.md](../../README.md) at the repository root.
**k3s / cluster deploy:** see [../k8s/README.md](../k8s/README.md).

## Files in this directory

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Frontend, Administration FE, Backend, PostgreSQL, MinIO, gateway |
| `.env.example` | Shared environment variables — copy to `.env` |

Gateway routing is shared with k8s: [../k8s/base/Caddyfile](../k8s/base/Caddyfile).

## Quick start

From this directory:

```bash
cp .env.example .env
# Set JWT_SECRET and other change-me values

docker compose up -d --build
```

From the repository root:

```bash
docker compose -f deployment/compose/docker-compose.yml --env-file deployment/compose/.env up -d --build
```

Compose does not provision staff. After services are healthy:

```bash
docker compose -f deployment/compose/docker-compose.yml --env-file deployment/compose/.env exec backend alembic upgrade head
docker compose -f deployment/compose/docker-compose.yml --env-file deployment/compose/.env exec backend flycatch-seed-records
docker compose -f deployment/compose/docker-compose.yml --env-file deployment/compose/.env exec backend flycatch-bootstrap \
  --user-1-email admin1@example.com \
  --user-2-email admin2@example.com \
  --user-2-role editor
```

There is no default password. Bootstrap prompts for two passwords (min 12 characters). Sign in at `http://localhost:8080/admin`. Full startup notes: [README.md](../../README.md#quick-start-docker-compose) and [docs/onboarding.md](../../docs/onboarding.md).

`PUBLIC_ENVIRONMENT` / `ENVIRONMENT` default to `development` so pages are not SEO-indexed.

Validation scenarios: [quickstart.md](../../specs/001-website-foundation/quickstart.md).
