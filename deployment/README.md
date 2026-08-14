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

```bash
cp .env.example .env
docker compose up -d
```

Validation scenarios: [quickstart.md](../specs/001-website-foundation/quickstart.md).
