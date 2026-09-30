from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time

COOKIE_NAME = "admin_microsoft_state"
COOKIE_PATH = "/api/v1/admin/auth/microsoft"
COOKIE_MAX_AGE = 600


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _b64decode(value: str) -> bytes:
    pad = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + pad)


def pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = _b64encode(digest)
    return verifier, challenge


def sign_state(payload: dict, secret: str) -> str:
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    mac = hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest()
    return f"{body}.{_b64encode(mac)}"


def read_state(value: str | None, secret: str, now: float | None = None) -> dict | None:
    if not value or "." not in value:
        return None
    body, mac = value.split(".", 1)
    expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest()
    try:
        given = _b64decode(mac)
    except (ValueError, TypeError):
        return None
    if len(given) != len(expected) or not hmac.compare_digest(given, expected):
        return None
    try:
        payload = json.loads(_b64decode(body))
    except (ValueError, TypeError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    current = time.time() if now is None else now
    try:
        exp = float(payload["exp"])
    except (KeyError, TypeError, ValueError):
        return None
    if current > exp:
        return None
    for key in ("state", "verifier", "nonce"):
        if not isinstance(payload.get(key), str) or not payload[key]:
            return None
    return payload


def new_state_payload() -> dict:
    verifier, challenge = pkce_pair()
    return {
        "state": secrets.token_urlsafe(32),
        "verifier": verifier,
        "nonce": secrets.token_urlsafe(32),
        "challenge": challenge,
        "exp": int(time.time()) + COOKIE_MAX_AGE,
    }
