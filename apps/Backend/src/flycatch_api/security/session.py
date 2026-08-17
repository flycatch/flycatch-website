import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from flycatch_api.config import settings


def ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(f"{settings.session_secret}{token}".encode()).hexdigest()


def session_idle_expiry(from_time: datetime | None = None) -> datetime:
    base = from_time or datetime.now(UTC)
    return base + timedelta(minutes=settings.session_idle_minutes)


def session_absolute_expiry(from_time: datetime | None = None) -> datetime:
    base = from_time or datetime.now(UTC)
    return base + timedelta(hours=settings.session_absolute_hours)
