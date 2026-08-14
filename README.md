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
docs/                             # Conventions and onboarding (implementation phase)
```

## OpenAPI — single source of truth

All cross-boundary shapes live in `specs/001-website-foundation/contracts/` (OpenAPI 3.1).

- **Backend** MUST implement these contracts.
- **Frontend** MUST generate or validate build-time types from the content, settings, SEO, and publish schemas.
- **Administration FE** MUST use an OpenAPI-generated API client — no hand-written DTOs that bypass the contract.

See [contracts/README.md](specs/001-website-foundation/contracts/README.md).

## Deployment

Shared local and preview setup for Frontend, Administration FE, Backend, PostgreSQL, and object storage.

### Prerequisites

- Docker and Docker Compose
- Node.js 22 LTS, pnpm, Python 3.12 (for local app development)

### Quick start

```bash
cp deployment/.env.example deployment/.env
# Edit deployment/.env as needed

docker compose -f deployment/docker-compose.yml up -d
```

Gateway (default `http://localhost:8080`):

| Path | Service |
| --- | --- |
| `/` | Frontend |
| `/admin` | Administration FE |
| `/api` | Backend |

After services are healthy:

1. Run Backend migrations and provision an administrator.
2. Export the published snapshot and build `apps/Frontend`.
3. Rebuild containers when app images change: `docker compose -f deployment/docker-compose.yml up -d --build`

Environment variables are documented in `deployment/.env.example`. Do not commit `deployment/.env`.

### Deployment files

| File | Purpose |
| --- | --- |
| `deployment/docker-compose.yml` | All foundation services |
| `deployment/.env.example` | Shared environment configuration |
| `deployment/Caddyfile` | Path-based gateway routing |

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
