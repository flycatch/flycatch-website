# Kubernetes — Harbor + Argo CD

Secrets and credentials must never be committed. Bootstrap against the Flycatch k3s
cluster using this file as the single source of truth.

Compose / local setup lives next door: [../compose/README.md](../compose/README.md).
The Caddy gateway config is shared at [base/Caddyfile](base/Caddyfile) (Compose mounts the same file).

## Layout

```
deployment/k8s/
  base/                  # Namespace, Deployments, Services, ConfigMap, Caddyfile ConfigMap
  overlays/dev/          # Ingress (TLS), noindex Middleware, image tags
  overlays/prod/         # www.flycatchtech.com Ingress (TLS deferred), prod ConfigMap
  scripts/deploy-dev.sh  # Disabled: superseded by Jenkins, body commented out
```

Jenkins (`Jenkinsfile` + `.cicd.yaml` at the repo root, using the shared
`harborImagePipeline()`) builds and pushes the three images on pushes to `dev`
(and `main` → prod overlay) and bumps the matching overlay’s image tags.

Jenkins-published tags look like `dev-v0.1.0.42` / `prod-v0.1.0.42` (mutable env
tag + immutable versioned tag).

`deploy-dev.sh` is disabled (`exit 0` at the top) so it can't be run by
accident and clash with Jenkins.

Argo CD Applications are owned by the platform app-of-apps in
[flycatch/k3s-platform](https://github.com/flycatch/k3s-platform):

- `infrastructure/flycatch-website/application-dev.yaml`
- `infrastructure/flycatch-website/application-prod.yaml`

Do **not** `kubectl apply` an Application from this repo — that would duplicate the
app and use the wrong Argo project (`default` instead of `platform`).

Ingress routes only to `gateway:8080`. Caddy path-splits `/`, `/admin`, and `/api`
to the Frontend, Administration FE, and Backend Services (same names as Compose).

Preview manifests:

```bash
kubectl kustomize deployment/k8s/overlays/dev
kubectl kustomize deployment/k8s/overlays/prod
```

---

# Dev environment

**SEO:** non-production. ConfigMap uses `PUBLIC_ENVIRONMENT=development`, and Traefik
Middleware `noindex` adds `X-Robots-Tag: noindex, nofollow` on every response.

Hostname: `https://flycatch-website-dev.k3s.flycatchtech.in`

## Prerequisites

- kubectl context pointing at the Flycatch k3s cluster
- Harbor project `flycatch-website` + robot with push (local script) and pull (cluster)
- Shared Postgres in namespace `database` healthy (Bitnami; container name `postgresql`)
- Shared MinIO in namespace `database` healthy (Service `minio.database.svc.cluster.local:9000`)
- Traefik IngressClass and cert-manager ClusterIssuer `letsencrypt-production`
- Cloudflare DNS access for `*.k3s.flycatchtech.in`
- Local tools: `docker`, `kustomize`, `git`

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
  --from-literal=RECAPTCHA_SECRET_KEY='<recaptcha-secret-key>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 5. DNS

Create a Cloudflare A (or CNAME) record:

```text
flycatch-website-dev.k3s.flycatchtech.in → <Traefik LoadBalancer IP>
```

(Same LB IP used by other `*.k3s.flycatchtech.in` apps.)

## 6. Build, push, and bump image tags

Normal path: push to `dev` and let the Jenkins multibranch pipeline
(`harborImagePipeline()`, configured via `.cicd.yaml`) build, push, and bump
`overlays/dev/kustomization.yaml` for you.

Manual fallback (only if Jenkins is unavailable): `deploy-dev.sh` is disabled
(commented out behind an `exit 0` guard). Uncomment it, then from a machine
that can reach Harbor (LAN/VPN), with a clean git working tree:

```bash
export HARBOR_USERNAME='robot$flycatch-website+githubbot'
export HARBOR_PASSWORD='...'
./deployment/k8s/scripts/deploy-dev.sh
```

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

## 10. Security headers checks

The shared Caddy gateway ([base/Caddyfile](base/Caddyfile)) sets HSTS, COOP,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and
`Permissions-Policy` on every response. CSP is route-scoped: both the public
site and `/admin*` allow `'unsafe-inline'` in `script-src` and `style-src`
(Astro inlines small page scripts such as the header/hamburger module, plus
JSON-LD; Admin also needs `blob:` for media previews). Poppins is self-hosted,
so Google Fonts is not in the policy.

```bash
curl -sI https://flycatch-website-dev.k3s.flycatchtech.in/ \
  | grep -iE 'content-security|strict-transport|cross-origin|x-frame|x-content'
curl -sI https://flycatch-website-dev.k3s.flycatchtech.in/admin/ \
  | grep -i content-security
```

Expect `Strict-Transport-Security`, `Cross-Origin-Opener-Policy: same-origin`,
`X-Frame-Options: DENY`, and a `Content-Security-Policy` on both `/` and
`/admin/`. Both policies should include `'unsafe-inline'` in `script-src`.
After deploy, load `/` and `/admin/` in a browser and confirm the console has
no CSP violations (especially that the header hamburger drawer opens).

Local Compose (HTTP on `:8080`) returns the same headers; browsers ignore
HSTS over non-HTTPS.

## Rollback (dev)

Revert the image-tag commit in `overlays/dev/kustomization.yaml` (or re-run
`deploy-dev.sh` from an older commit) and let Argo CD sync. Secrets, DNS, and the
shared Postgres/MinIO data are unchanged by that rollback.

---

# Production environment

Namespace: `flycatch-website-prod`  
Overlay: [overlays/prod](overlays/prod)  
Hostname (Ingress): `www.flycatchtech.com`  
Apex `flycatchtech.com` → www: handle with a Cloudflare Redirect Rule when you flip DNS
(keeps a single Let’s Encrypt cert for `www`).

**SEO:** ConfigMap sets `PUBLIC_ORIGIN=https://www.flycatchtech.com` and
`PUBLIC_ENVIRONMENT=production`. There is **no** Traefik noindex middleware.
Frontend SSR prefers `process.env.PUBLIC_ENVIRONMENT` / `PUBLIC_ORIGIN` from the
ConfigMap over build-time defaults.

**TLS:** cert-manager is **intentionally not** enabled on the Ingress yet. Enabling
`letsencrypt-production` before Cloudflare points `www` at Traefik causes failed
HTTP-01 Orders and can exhaust Let’s Encrypt rate limits. Enable TLS only after DNS
(see “TLS after DNS” below).

## P1. Namespace + Harbor pull secret

```bash
kubectl create namespace flycatch-website-prod --dry-run=client -o yaml | kubectl apply -f -

kubectl -n flycatch-website-prod create secret docker-registry harbor-pull \
  --docker-server=registry.k3s.flycatchtech.in \
  --docker-username='robot$flycatch-website+githubbot' \
  --docker-password='<harbor-robot-secret>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

## P2. Postgres role and empty database

```bash
kubectl -n database exec -it sts/postgres -c postgresql -- \
  env PGPASSWORD="<postgres-admin-password>" \
  psql -U postgres \
  -c "CREATE ROLE flycatch_website_prod LOGIN PASSWORD '<prod-app-db-password>';" \
  -c "CREATE DATABASE flycatch_website_prod OWNER flycatch_website_prod;"
```

## P3. MinIO bucket

```bash
kubectl -n database port-forward svc/minio 9000:9000
# mc alias set ... then:
mc mb myminio/flycatch-website-prod
# Create/attach a policy that allows read/write only on bucket flycatch-website-prod
```

## P4. App secrets (new session/JWT/CSRF — do not copy from dev)

Template: [overlays/prod/secret.example.yaml](overlays/prod/secret.example.yaml)

```bash
kubectl -n flycatch-website-prod create secret generic flycatch-website-secrets \
  --from-literal=DATABASE_URL='postgresql+psycopg://flycatch_website_prod:<prod-app-db-password>@postgres.database.svc.cluster.local:5432/flycatch_website_prod' \
  --from-literal=S3_ACCESS_KEY='<minio-access-key>' \
  --from-literal=S3_SECRET_KEY='<minio-secret-key>' \
  --from-literal=SESSION_SECRET='<long-random-new>' \
  --from-literal=CSRF_SECRET='<long-random-new>' \
  --from-literal=JWT_SECRET='<long-random-new>' \
  --from-literal=BUILD_EXPORT_TOKEN='<long-random-new>' \
  --from-literal=RECAPTCHA_SECRET_KEY='<recaptcha-secret-key>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

## P5. Argo CD sync

Ensure `application-prod.yaml` is present in k3s-platform, then:

```bash
kubectl -n argocd get application flycatch-website-prod
kubectl -n flycatch-website-prod get pods,ingress
```

Pods may start against an empty DB until the data clone below finishes.

## P6. Clone latest data from `flycatch-website-dev`

**Source of truth for production content is the current k3s dev environment**, not
the legacy public server and not a fresh `flycatch-seed-records` run.

Pause CMS writes on dev (or plan a second refresh right before DNS).

### Postgres dump / restore

```bash
# Dump custom format from the shared Postgres (dev DB name: flycatch_website)
kubectl -n database exec -i sts/postgres -c postgresql -- \
  env PGPASSWORD="<dev-app-or-admin-password>" \
  pg_dump -U flycatch_website -Fc -d flycatch_website \
  > flycatch_website_dev.dump

# Restore into empty prod DB (--no-owner so roles map cleanly)
kubectl -n database exec -i sts/postgres -c postgresql -- \
  env PGPASSWORD="<prod-app-db-password>" \
  pg_restore -U flycatch_website_prod -d flycatch_website_prod \
  --clean --if-exists --no-owner --role=flycatch_website_prod \
  < flycatch_website_dev.dump
```

If `pg_restore` warns about existing objects on a second run, that is expected with
`--clean`. Fix ownership if needed:

```bash
kubectl -n database exec -it sts/postgres -c postgresql -- \
  env PGPASSWORD="<postgres-admin-password>" \
  psql -U postgres -d flycatch_website_prod \
  -c "ALTER DATABASE flycatch_website_prod OWNER TO flycatch_website_prod;" \
  -c "REASSIGN OWNED BY flycatch_website TO flycatch_website_prod;"
```

### MinIO mirror

```bash
kubectl -n database port-forward svc/minio 9000:9000
# mc alias set ... then:
mc mirror --overwrite myminio/flycatch-website myminio/flycatch-website-prod
```

### After clone

- **Do not** run `flycatch-seed-records` (it would overwrite cloned CMS data).
- Staff users come with the DB dump; run `flycatch-bootstrap` only if logins are missing.
- Restart backend so it reconnects cleanly:

```bash
kubectl -n flycatch-website-prod rollout restart deploy/backend
kubectl -n flycatch-website-prod rollout status deploy/backend
```

### Smoke without public DNS

```bash
kubectl -n flycatch-website-prod port-forward svc/gateway 8080:8080
# Browse http://127.0.0.1:8080/ — expect blogs, media, /admin login from cloned data
curl -s http://127.0.0.1:8080/robots.txt
# Expect Allow: / (PUBLIC_ENVIRONMENT=production from ConfigMap)
```

Optional: repeat dump + `mc mirror` immediately before the Cloudflare cutover if
editors kept changing content on dev.

## P7. TLS after DNS (rate-limit safe)

1. Point Cloudflare **`www`** A/CNAME at the Traefik LoadBalancer IP (you do this later).
2. Apex: Cloudflare Redirect Rule `flycatchtech.com/*` → `https://www.flycatchtech.com/$1` (301).
3. In a follow-up PR, update [overlays/prod/ingress.yaml](overlays/prod/ingress.yaml):

```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
spec:
  tls:
    - hosts:
        - www.flycatchtech.com
      secretName: flycatch-website-prod-tls
```

4. Let Argo sync once. Confirm:

```bash
kubectl -n flycatch-website-prod get certificate,order,challenge
curl -sI https://www.flycatchtech.com/ | head
```

Do **not** toggle the issuer annotation repeatedly. One Certificate request for
`www` only stays well within Let’s Encrypt limits.

## P8. Post-cutover SEO checks

```bash
curl -s https://www.flycatchtech.com/robots.txt
# Expect Allow: /, Sitemap, Disallow /admin and /api — not Disallow: /
curl -sI https://www.flycatchtech.com/ | grep -i robots
# Must NOT show X-Robots-Tag: noindex
curl -sI https://www.flycatchtech.com/en/services
# Expect 301 → /services
curl -s https://www.flycatchtech.com/sitemap.xml | head
# locs should use https://www.flycatchtech.com
```

Then resubmit the sitemap in Google Search Console.

## Rollback (prod)

- **Wrong image:** revert tags in `overlays/prod/kustomization.yaml`; Argo syncs.
- **Bad cutover:** restore Cloudflare DNS to the legacy server; leave the k3s
  prod namespace running for debugging.
