#!/usr/bin/env bash
# GitOps tag bump — called by Jenkins after all images are pushed to Harbor.
#
# Updates the kustomization.yaml for the target environment overlay with the
# new image SHA tags, commits the change, and pushes to GitHub.
# Argo CD detects the git change and deploys automatically.
#
# Required env vars:
#   ENVIRONMENT  — overlay name matching .cicd.yaml environments (dev, qa, uat, prod)
#   SHA          — full git SHA of the commit that was built
#   GIT_USER     — git commit author name  (from Jenkins credential)
#   GIT_EMAIL    — git commit author email
#
# Required tools on Jenkins agent: git, kustomize

set -euo pipefail

: "${ENVIRONMENT:?ENVIRONMENT is required}"
: "${SHA:?SHA is required}"
: "${GIT_USER:?GIT_USER is required}"
: "${GIT_EMAIL:?GIT_EMAIL is required}"

REGISTRY="registry.k3s.flycatchtech.in"
PROJECT="flycatch-website"
OVERLAY="deployment/k8s/overlays/${ENVIRONMENT}"
REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "==> GitOps tag bump"
echo "    environment : ${ENVIRONMENT}"
echo "    sha         : ${SHA}"
echo "    overlay     : ${OVERLAY}"

# Ensure we are at repo root regardless of where Jenkins runs the script
cd "${REPO_ROOT}"

if [ ! -d "${OVERLAY}" ]; then
  echo "error: overlay directory '${OVERLAY}' does not exist." >&2
  echo "       Create it before running this script." >&2
  exit 1
fi

if ! command -v kustomize &>/dev/null; then
  echo "error: kustomize is not installed on this agent." >&2
  exit 1
fi

# Configure git identity for the commit
git config user.name  "${GIT_USER}"
git config user.email "${GIT_EMAIL}"

# Bump all three image tags in the overlay kustomization.yaml
cd "${OVERLAY}"

kustomize edit set image \
  "${REGISTRY}/${PROJECT}/frontend=${REGISTRY}/${PROJECT}/frontend:${ENVIRONMENT}-${SHA}" \
  "${REGISTRY}/${PROJECT}/backend=${REGISTRY}/${PROJECT}/backend:${ENVIRONMENT}-${SHA}" \
  "${REGISTRY}/${PROJECT}/administration-fe=${REGISTRY}/${PROJECT}/administration-fe:${ENVIRONMENT}-${SHA}"

cd "${REPO_ROOT}"

git add "${OVERLAY}/kustomization.yaml"

# Nothing changed — tags were already up to date
if git diff --staged --quiet; then
  echo "==> Image tags already up to date. Nothing to commit."
  exit 0
fi

git commit -m "chore(deploy): bump ${ENVIRONMENT} images to ${SHA}"
git push origin HEAD

echo "==> Done. Argo CD will detect the change and deploy shortly."
echo "    To rollback: git revert HEAD && git push origin HEAD"
