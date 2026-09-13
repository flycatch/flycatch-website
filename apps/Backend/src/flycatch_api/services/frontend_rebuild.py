from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from flycatch_api.config import settings

logger = logging.getLogger(__name__)

_SKIP_PREFIXES = (
    "/api/v1/admin/auth",
    "/api/v1/admin/roles",
    "/api/v1/admin/administrators",
    "/api/v1/admin/media",
)

_MUTATING = frozenset({"POST", "PUT", "PATCH", "DELETE"})

_last_trigger_at = 0.0


def should_rebuild_after_admin_request(method: str, path: str, status_code: int) -> bool:
    if status_code >= 300:
        return False
    if method.upper() not in _MUTATING:
        return False
    if not path.startswith("/api/v1/admin/"):
        return False
    return not any(path.startswith(prefix) for prefix in _SKIP_PREFIXES)


def request_frontend_rebuild(reason: str, snapshot_revision: str | None = None) -> bool:
    """Notify the frontend rebuild webhook. Publish succeeds even if this fails."""
    global _last_trigger_at
    url = settings.frontend_rebuild_webhook_url.strip()
    if not url:
        return False

    now = time.monotonic()
    cooldown = max(0, settings.frontend_rebuild_cooldown_seconds)
    if cooldown and now - _last_trigger_at < cooldown:
        logger.info("frontend rebuild coalesced (%s)", reason)
        return True

    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    token = settings.frontend_rebuild_webhook_token.strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    payload: dict[str, Any] = {
        "event_type": settings.frontend_rebuild_event_type,
        "client_payload": {
            "reason": reason,
            "snapshot_revision": snapshot_revision,
            "environment": settings.environment,
        },
    }
    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=5.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("frontend rebuild webhook failed (%s): %s", reason, exc)
        return False

    _last_trigger_at = now
    logger.info("frontend rebuild requested (%s)", reason)
    return True


def maybe_request_frontend_rebuild(method: str, path: str, status_code: int) -> bool:
    if not should_rebuild_after_admin_request(method, path, status_code):
        return False
    return request_frontend_rebuild(f"{method} {path}")
