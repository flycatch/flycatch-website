# Deployment

Deployment-specific files for Docker Compose and environment configuration.

**Project overview, stack, and full setup instructions:** see [README.md](../README.md) at the repository root.

## Files in this directory

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Frontend, Administration FE, Backend, PostgreSQL, MinIO, gateway |
| `.env.example` | Shared environment variables — copy to `.env` |
| `Caddyfile` | Gateway routing: `/`, `/admin`, `/api` |

## Quick start

From this directory:

```bash
cp .env.example .env
# Set JWT_SECRET and other change-me values

docker compose up -d --build
```

From the repository root: `docker compose -f deployment/docker-compose.yml up -d --build`.

Compose does not provision staff. After services are healthy:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend flycatch-seed-records
docker compose exec backend flycatch-bootstrap \
  --user-1-email admin1@example.com \
  --user-2-email admin2@example.com \
  --user-2-role editor
```

There is no default password. Bootstrap prompts for two passwords (min 12 characters). Sign in at `http://localhost:8080/admin`. Full startup notes: [README.md](../README.md#quick-start-docker-compose) and [docs/onboarding.md](../docs/onboarding.md).

Validation scenarios: [quickstart.md](../specs/001-website-foundation/quickstart.md).
