# Kubernetes (dev) — Harbor + Argo CD

Secrets and credentials must never be committed. Bootstrap against the Flycatch k3s
cluster using this file as the single source of truth.

Compose / local setup lives next door: [../compose/README.md](../compose/README.md).
The Caddy gateway config is shared at [base/Caddyfile](base/Caddyfile) (Compose mounts the same file).

## Layout

```
deployment/k8s/
  base/                 # Namespace, Deployments, Services, ConfigMap, Caddyfile ConfigMap
  overlays/dev/         # Ingress (TLS), noindex Middleware, image tags, replica counts
  scripts/deploy-dev.sh # Build/push Harbor images + bump overlay tags
```

The Argo CD Application is owned by the platform app-of-apps in
[flycatch/k3s-platform](https://github.com/flycatch/k3s-platform):

`infrastructure/flycatch-website/application.yaml`

Do **not** `kubectl apply` an Application from this repo — that would duplicate the
app and use the wrong Argo project (`default` instead of `platform`).

Ingress routes only to `gateway:8080`. Caddy path-splits `/`, `/admin`, and `/api`
to the Frontend, Administration FE, and Backend Services (same names as Compose).

**SEO:** this overlay is a non-production environment. App builds use
`PUBLIC_ENVIRONMENT=development` / `ENVIRONMENT=development`, and Traefik Middleware
`noindex` adds `X-Robots-Tag: noindex, nofollow` on every response.

Hostname: `https://flycatch-website-dev.k3s.flycatchtech.in`

## Prerequisites

- kubectl context pointing at the Flycatch k3s cluster
- Harbor project `flycatch-website` + robot with push (local script) and pull (cluster)
- Shared Postgres in namespace `database` healthy (Bitnami; container name `postgresql`)
- Shared MinIO in namespace `database` healthy (Service `minio.database.svc.cluster.local:9000`)
- Traefik IngressClass and cert-manager ClusterIssuer `letsencrypt-production`
- Cloudflare DNS access for `*.k3s.flycatchtech.in`
- Local tools: `docker`, `kustomize`, `git`

Preview manifests without applying:

```bash
kubectl kustomize deployment/k8s/overlays/dev
```

## 0. Argo CD access to the app repo

If the app repo is private, Argo CD must be able to clone it, or the Application
`flycatch-website-dev` stays `Unknown` with authentication errors.

```bash
kubectl -n argocd create secret generic repo-flycatch-website \
  --from-literal=type=git \
  --from-literal=url=https://github.com/flycatch/flycatch-website.git \
  --from-literal=username=git \
  --from-literal=password='<github-pat-with-repo-read>' \
  --dry-run=client -o yaml | kubectl label --local -f - \
    argocd.argoproj.io/secret-type=repository -o yaml | kubectl apply -f -
```

The `url` must match the Application source exactly. Then hard-refresh:

```bash
kubectl -n argocd annotate application flycatch-website-dev \
  argocd.argoproj.io/refresh=hard --overwrite
```

## 1. Namespace + Harbor pull secret

```bash
kubectl create namespace flycatch-website-dev --dry-run=client -o yaml | kubectl apply -f -

kubectl -n flycatch-website-dev create secret docker-registry harbor-pull \
  --docker-server=registry.k3s.flycatchtech.in \
  --docker-username='robot$flycatch-website+githubbot' \
  --docker-password='<harbor-robot-secret>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

Create `harbor-pull` **before** workloads start, or pods stay in `ImagePullBackOff`.

## 2. Postgres role and database (reuse shared cluster Postgres)

Service is `postgres.database.svc.cluster.local`. Use container `postgresql`.
Do **not** deploy a new Postgres pod for this app.

First install:

```bash
kubectl -n database exec -it sts/postgres -c postgresql -- \
  env PGPASSWORD="<postgres-admin-password>" \
  psql -U postgres \
  -c "CREATE ROLE flycatch_website LOGIN PASSWORD '<app-db-password>';" \
  -c "CREATE DATABASE flycatch_website OWNER flycatch_website;"
```

Reinstall (role/database already exist — `CREATE` will fail):

```bash
kubectl -n database exec -it sts/postgres -c postgresql -- \
  env PGPASSWORD="<postgres-admin-password>" \
  psql -U postgres \
  -c "ALTER ROLE flycatch_website LOGIN PASSWORD '<app-db-password>';" \
  -c "ALTER DATABASE flycatch_website OWNER TO flycatch_website;"
```

Connection string used by the Backend:

```text
postgresql+psycopg://flycatch_website:<app-db-password>@postgres.database.svc.cluster.local:5432/flycatch_website
```

Migrations run automatically on Backend container start (`alembic upgrade head`).

## 3. MinIO bucket and credentials (reuse shared cluster MinIO)

Service is `minio.database.svc.cluster.local:9000`. Create a dedicated bucket and
least-privilege access key for this app (do not reuse MinIO root credentials in the
app Secret if you can avoid it).

Example with the MinIO client against a port-forward:

```bash
kubectl -n database port-forward svc/minio 9000:9000

# In another shell, after mc alias set ...
mc mb myminio/flycatch-website
mc admin user add myminio flycatch-website '<minio-access-key>' '<minio-secret-key>'
# Attach a policy that allows read/write only on bucket flycatch-website
```

ConfigMap already points `S3_ENDPOINT` / `S3_BUCKET` at the shared service and
`flycatch-website` bucket. Put the access key pair in the app Secret.

## 4. App secrets

Template: [overlays/dev/secret.example.yaml](overlays/dev/secret.example.yaml)
(not applied by Kustomize).

```bash
kubectl -n flycatch-website-dev create secret generic flycatch-website-secrets \
  --from-literal=DATABASE_URL='postgresql+psycopg://flycatch_website:<app-db-password>@postgres.database.svc.cluster.local:5432/flycatch_website' \
  --from-literal=S3_ACCESS_KEY='<minio-access-key>' \
  --from-literal=S3_SECRET_KEY='<minio-secret-key>' \
  --from-literal=SESSION_SECRET='<long-random>' \
  --from-literal=CSRF_SECRET='<long-random>' \
  --from-literal=JWT_SECRET='<long-random>' \
  --from-literal=BUILD_EXPORT_TOKEN='<long-random>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 5. DNS

Create a Cloudflare A (or CNAME) record:

```text
flycatch-website-dev.k3s.flycatchtech.in → <Traefik LoadBalancer IP>
```

(Same LB IP used by other `*.k3s.flycatchtech.in` apps.)

## 6. Build, push, and bump image tags

From a machine that can reach Harbor (LAN/VPN), with a clean git working tree:

```bash
export HARBOR_USERNAME='robot$flycatch-website+githubbot'
export HARBOR_PASSWORD='...'
./deployment/k8s/scripts/deploy-dev.sh
```

The script builds `linux/amd64` images, pushes `:SHA` and `:latest` to Harbor,
updates `overlays/dev/kustomization.yaml` image tags, commits, and pushes so Argo CD
can sync.

Images:

- `registry.k3s.flycatchtech.in/flycatch-website/backend`
- `registry.k3s.flycatchtech.in/flycatch-website/frontend`
- `registry.k3s.flycatchtech.in/flycatch-website/administration-fe`

Frontend and Administration FE are built with
`PUBLIC_ORIGIN=https://flycatch-website-dev.k3s.flycatchtech.in` and
`PUBLIC_ENVIRONMENT=development`.

## 7. Verify Argo CD sync

```bash
kubectl -n argocd get application flycatch-website-dev
kubectl -n flycatch-website-dev get pods,ingress,certificate
```

## 8. One-time seed and staff bootstrap

After the Backend pod is Ready:

```bash
kubectl -n flycatch-website-dev exec -it deploy/backend -- flycatch-seed-records
kubectl -n flycatch-website-dev exec -it deploy/backend -- flycatch-bootstrap \
  --user-1-email admin1@example.com \
  --user-2-email admin2@example.com \
  --user-2-role editor
```

Sign in at `https://flycatch-website-dev.k3s.flycatchtech.in/admin`.

## 9. SEO / noindex checks

```bash
curl -sI https://flycatch-website-dev.k3s.flycatchtech.in/ | grep -i robots
curl -s https://flycatch-website-dev.k3s.flycatchtech.in/robots.txt
```

Expect `X-Robots-Tag: noindex, nofollow` and `Disallow: /` in robots.txt.

## Rollback

Revert the image-tag commit in `overlays/dev/kustomization.yaml` (or re-run
`deploy-dev.sh` from an older commit) and let Argo CD sync. Secrets, DNS, and the
shared Postgres/MinIO data are unchanged by that rollback.
