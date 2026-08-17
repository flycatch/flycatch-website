from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
from jwt import InvalidTokenError

from flycatch_api.config import settings

ACCESS_TOKEN_TYPE = "access"


class JwtError(Exception):
    """Access JWT is missing, expired, or otherwise invalid."""


def issue_access_token(*, subject: UUID, session_id: UUID) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(subject),
        "sid": str(session_id),
        "typ": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_minutes),
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _validate_claims(payload: dict) -> dict:
    if payload.get("typ") != ACCESS_TOKEN_TYPE:
        raise JwtError("invalid access token type")
    if "sub" not in payload or "sid" not in payload:
        raise JwtError("invalid access token claims")
    if "roles" in payload or "permissions" in payload:
        raise JwtError("access token must not contain roles or permissions")
    return payload


def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except InvalidTokenError as exc:
        raise JwtError("invalid access token") from exc
    return _validate_claims(payload)


def decode_access_token_allow_expired(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
    except InvalidTokenError as exc:
        raise JwtError("invalid access token") from exc
    return _validate_claims(payload)


def access_expires_in_seconds() -> int:
    return settings.jwt_access_minutes * 60
