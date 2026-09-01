#!/usr/bin/env bash
# Build + push dev images to Harbor and bump GitOps tags for Argo CD.
# Requires: docker, kustomize, git; env HARBOR_USERNAME + HARBOR_PASSWORD.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

REGISTRY="${REGISTRY:-registry.k3s.flycatchtech.in}"
BACKEND_IMAGE="${BACKEND_IMAGE:-${REGISTRY}/flycatch-website/backend}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-${REGISTRY}/flycatch-website/frontend}"
ADMIN_FE_IMAGE="${ADMIN_FE_IMAGE:-${REGISTRY}/flycatch-website/administration-fe}"
OVERLAY="deployment/k8s/overlays/dev"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://flycatch-website-dev.k3s.flycatchtech.in}"
PUBLIC_ENVIRONMENT="${PUBLIC_ENVIRONMENT:-development}"

die() {
  echo "error: $*" >&2
  exit 1
}

[[ -n "${HARBOR_USERNAME:-}" ]] || die "HARBOR_USERNAME is required"
[[ -n "${HARBOR_PASSWORD:-}" ]] || die "HARBOR_PASSWORD is required"

command -v docker >/dev/null || die "docker is required"
command -v kustomize >/dev/null || die "kustomize is required on PATH"
command -v git >/dev/null || die "git is required"

if [[ -n "$(git status --porcelain)" ]]; then
  die "working tree is dirty; commit or stash changes before deploying"
fi

TAG="$(git rev-parse HEAD)"
echo "==> tag ${TAG}"
echo "==> PUBLIC_ORIGIN=${PUBLIC_ORIGIN}"
echo "==> PUBLIC_ENVIRONMENT=${PUBLIC_ENVIRONMENT}"

echo "==> docker login ${REGISTRY}"
echo "${HARBOR_PASSWORD}" | docker login "${REGISTRY}" -u "${HARBOR_USERNAME}" --password-stdin

echo "==> build backend (linux/amd64)"
docker build --platform linux/amd64 -f apps/Backend/Dockerfile \
  -t "${BACKEND_IMAGE}:${TAG}" \
  -t "${BACKEND_IMAGE}:latest" \
  apps/Backend

echo "==> build frontend (linux/amd64)"
docker build --platform linux/amd64 -f apps/Frontend/Dockerfile \
  --build-arg "PUBLIC_ORIGIN=${PUBLIC_ORIGIN}" \
  --build-arg "PUBLIC_ENVIRONMENT=${PUBLIC_ENVIRONMENT}" \
  -t "${FRONTEND_IMAGE}:${TAG}" \
  -t "${FRONTEND_IMAGE}:latest" \
  apps/Frontend

echo "==> build administration-fe (linux/amd64)"
docker build --platform linux/amd64 -f apps/Administration-FE/Dockerfile \
  --build-context "specs=specs" \
  --build-arg "PUBLIC_ORIGIN=${PUBLIC_ORIGIN}" \
  --build-arg "PUBLIC_ENVIRONMENT=${PUBLIC_ENVIRONMENT}" \
  -t "${ADMIN_FE_IMAGE}:${TAG}" \
  -t "${ADMIN_FE_IMAGE}:latest" \
  apps/Administration-FE

echo "==> push images"
docker push "${BACKEND_IMAGE}:${TAG}"
docker push "${BACKEND_IMAGE}:latest"
docker push "${FRONTEND_IMAGE}:${TAG}"
docker push "${FRONTEND_IMAGE}:latest"
docker push "${ADMIN_FE_IMAGE}:${TAG}"
docker push "${ADMIN_FE_IMAGE}:latest"

echo "==> bump kustomize image tags"
(
  cd "${OVERLAY}"
  kustomize edit set image \
    "${BACKEND_IMAGE}=${BACKEND_IMAGE}:${TAG}" \
    "${FRONTEND_IMAGE}=${FRONTEND_IMAGE}:${TAG}" \
    "${ADMIN_FE_IMAGE}=${ADMIN_FE_IMAGE}:${TAG}"
)

echo "==> commit and push GitOps tag bump"
git add "${OVERLAY}/kustomization.yaml"
if git diff --staged --quiet; then
  echo "Image tags already up to date; nothing to commit"
else
  git commit -m "chore(deploy): bump dev images to ${TAG}"
  git push origin HEAD
fi

echo
echo "Done. Argo CD should sync shortly."
echo "  kubectl -n argocd get application flycatch-website-dev"
echo "  kubectl -n flycatch-website-dev get pods,ingress"
