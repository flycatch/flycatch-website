#!/usr/bin/env bash
# Rebuild only the public Frontend image from live CMS content and bump the GitOps tag.
# Used by the publish webhook (GitHub repository_dispatch: frontend-rebuild).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

REGISTRY="${REGISTRY:-registry.k3s.flycatchtech.in}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-${REGISTRY}/flycatch-website/frontend}"
OVERLAY="deployment/k8s/overlays/dev"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://flycatch-website-dev.k3s.flycatchtech.in}"
PUBLIC_ENVIRONMENT="${PUBLIC_ENVIRONMENT:-development}"
API_ORIGIN="${API_ORIGIN:-${PUBLIC_ORIGIN}}"

die() {
  echo "error: $*" >&2
  exit 1
}

[[ -n "${HARBOR_USERNAME:-}" ]] || die "HARBOR_USERNAME is required"
[[ -n "${HARBOR_PASSWORD:-}" ]] || die "HARBOR_PASSWORD is required"

command -v docker >/dev/null || die "docker is required"
command -v kustomize >/dev/null || die "kustomize is required on PATH"
command -v git >/dev/null || die "git is required"

TAG="cms-$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"
echo "==> tag ${TAG}"
echo "==> API_ORIGIN=${API_ORIGIN}"
echo "==> PUBLIC_ORIGIN=${PUBLIC_ORIGIN}"

echo "==> docker login ${REGISTRY}"
echo "${HARBOR_PASSWORD}" | docker login "${REGISTRY}" -u "${HARBOR_USERNAME}" --password-stdin

echo "==> build frontend (linux/amd64) against live public API"
docker build --platform linux/amd64 -f apps/Frontend/Dockerfile \
  --build-arg "PUBLIC_ORIGIN=${PUBLIC_ORIGIN}" \
  --build-arg "PUBLIC_ENVIRONMENT=${PUBLIC_ENVIRONMENT}" \
  --build-arg "API_ORIGIN=${API_ORIGIN}" \
  -t "${FRONTEND_IMAGE}:${TAG}" \
  -t "${FRONTEND_IMAGE}:latest" \
  apps/Frontend

echo "==> push frontend"
docker push "${FRONTEND_IMAGE}:${TAG}"
docker push "${FRONTEND_IMAGE}:latest"

echo "==> bump frontend image tag"
(
  cd "${OVERLAY}"
  kustomize edit set image "${FRONTEND_IMAGE}=${FRONTEND_IMAGE}:${TAG}"
)

echo "==> commit and push GitOps tag bump"
git add "${OVERLAY}/kustomization.yaml"
if git diff --staged --quiet; then
  echo "Frontend image tag already up to date; nothing to commit"
else
  git commit -m "chore(deploy): rebuild frontend after CMS publish ${TAG}"
  git push origin HEAD
fi

echo "Done. Argo CD should sync the new frontend image."
