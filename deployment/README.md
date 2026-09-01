# Deployment

How this app runs locally and on the cluster. Everything lives under this folder.

| Path | Purpose |
| --- | --- |
| [compose/](compose/) | Docker Compose stack (local / preview): Postgres, MinIO, apps, Caddy gateway |
| [k8s/](k8s/) | Kubernetes manifests (Kustomize) for the Flycatch k3s cluster |

Shared gateway routing for both compose and k8s: [k8s/base/Caddyfile](k8s/base/Caddyfile)
(Compose mounts this file; k8s loads it via ConfigMap).

**Project overview and day-to-day setup:** [README.md](../README.md).
