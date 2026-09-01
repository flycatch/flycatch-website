# Flycatch Website

Production-ready, SEO-first website foundation with three bounded surfaces:

| Surface | Folder | Role |
| --- | --- | --- |
| **Frontend** | `apps/Frontend` | Static public site (Astro, pre-rendered HTML) |
| **Administration FE** | `apps/Administration-FE` | Authenticated staff workspace (Astro + React) |
| **Backend** | `apps/Backend` | Contract-first API (FastAPI, PostgreSQL, S3-compatible storage) |

Ordinary public browsing does **not** require the Backend at runtime. Administration FE and publish flows do.

## Technology stack

- **Frontend / Administration FE**: Astro 5, React 19 (Administration FE only), TypeScript
- **Backend**: FastAPI, Python 3.12, PostgreSQL 16
- **Object storage**: S3-compatible (MinIO locally)
- **Deployment**: Docker Compose in `deployment/`

## Repository layout

```text
README.md                         # This file
apps/
├── Frontend/
├── Administration-FE/
└── Backend/
deployment/                       # Docker Compose, environment config, gateway
specs/001-website-foundation/     # Feature spec, plan, contracts, quickstart
specs/002-auth-rbac/              # JWT auth + RBAC spec, plan, contracts, quickstart
docs/                             # Conventions and onboarding (implementation phase)
```

## OpenAPI — single source of truth

Foundation payload schemas live in `specs/001-website-foundation/contracts/` (OpenAPI 3.1). Staff auth, RBAC, management, and publish live in `specs/002-auth-rbac/contracts/`.

- **Backend** MUST implement these contracts. Staff auth is JWT access + refresh (`Authorization: Bearer`), not cookies or CSRF.
- **Frontend** MUST generate or validate build-time types from the content, settings, SEO, and publish schemas.
- **Administration FE** MUST generate types from `admin-auth.v2`, `admin-rbac.v1`, `admin-management.v2`, and `publish.v2` — no hand-written token or permission DTOs. Tokens stay in memory only.

See [001 contracts](specs/001-website-foundation/contracts/README.md) and [002 contracts](specs/002-auth-rbac/contracts/README.md).

## Deployment

Shared local and preview setup for Frontend, Administration FE, Backend, PostgreSQL, and object storage. Step-by-step first boot (including staff users) is also in [docs/onboarding.md](docs/onboarding.md).

### Prerequisites

- Docker and Docker Compose
- Node.js 22 LTS, pnpm, Python 3.12 (for local app development)

### Quick start (Docker Compose)

Compose does **not** create staff accounts or apply migrations. There is no default login and no public sign-up.

1. Copy environment config and set secrets (`JWT_SECRET` and the other `change-me` values):

   ```bash
   cp deployment/.env.example deployment/.env
   ```

   Do not commit `deployment/.env`. Variable names are documented in `deployment/.env.example`.

2. Build and start all services from the repository root:

   ```bash
   docker compose -f deployment/docker-compose.yml up -d --build
   ```

   From `deployment/` you can use `docker compose up -d --build` instead.

3. After Postgres and MinIO are healthy, migrate, seed, and bootstrap two staff users:

   ```bash
   docker compose -f deployment/docker-compose.yml exec backend alembic upgrade head
   docker compose -f deployment/docker-compose.yml exec backend flycatch-seed-records
   docker compose -f deployment/docker-compose.yml exec backend flycatch-bootstrap \
     --user-1-email admin1@example.com \
     --user-2-email admin2@example.com \
     --user-2-role editor
   ```

   Passwords are prompted (minimum 12 characters) unless you pass `--user-1-password` and `--user-2-password`. User 1 is always role `administrator`. Re-running bootstrap with the same emails is idempotent and does not reset passwords.

   Example emails above are documentation only — use any addresses you control. Pytest uses different editor email/password fixtures; those are not created by Compose.

4. Sign in at `http://localhost:8080/admin`. Later staff: `flycatch-provision-admin --email someone@example.com --role editor` (`--role` is required: `administrator` or `editor`).

5. Rebuild app images after Frontend or Administration FE changes:

   ```bash
   docker compose -f deployment/docker-compose.yml up -d --build
   ```

   Stop the stack with `docker compose -f deployment/docker-compose.yml down`. Add `-v` only if you intend to wipe Postgres and MinIO volumes.

Gateway (default `http://localhost:8080`, `GATEWAY_PORT` in `.env`):

| Path | Service |
| --- | --- |
| `/` | Frontend |
| `/admin` | Administration FE |
| `/api` | Backend |

### Deployment files

| File | Purpose |
| --- | --- |
| `deployment/docker-compose.yml` | All foundation services |
| `deployment/.env.example` | Shared environment configuration |
| `deployment/Caddyfile` | Path-based gateway routing |

## Local Development (Running Individually)

While Docker Compose runs all services together, you can also run them individually during development. 

Make sure to install dependencies for the respective services first.

### 1. Frontend
The public website (Astro).
```bash
cd apps/Frontend
npm install
npm run dev
```
Runs at: `http://localhost:4321`

### 2. Administration FE
The admin dashboard (Astro + React).
```bash
cd apps/Administration-FE
npm install
npm run dev
```
Runs at: `http://localhost:4173`

### 3. Backend
The API server (FastAPI). Ensure you have PostgreSQL running.
```bash
cd apps/Backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
fastapi dev src/flycatch_api/main.py
```
Runs at: `http://localhost:8000` (FastAPI default)

## Documentation

| Document | Description |
| --- | --- |
| [spec.md](specs/001-website-foundation/spec.md) | Feature specification |
| [plan.md](specs/001-website-foundation/plan.md) | Implementation plan |
| [quickstart.md](specs/001-website-foundation/quickstart.md) | End-to-end validation scenarios |
| [data-model.md](specs/001-website-foundation/data-model.md) | Entities and validation rules |
| [research.md](specs/001-website-foundation/research.md) | Technology decisions |

## Quality gates

Before promotion, verify: static Frontend build, OpenAPI validation, consumer contract alignment, accessibility (WCAG 2.2 AA), SEO conventions, i18n (no hard-coded strings), security headers, and Playwright journeys (public no-JS + admin draft/publish).

Details in [quickstart.md](specs/001-website-foundation/quickstart.md).
