import pytest
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from flycatch_api.models import AdminSession, Administrator
from flycatch_api.security.session import session_idle_expiry


def test_idle_session_expired():
    now = datetime.now(UTC)
    session = AdminSession(
        id=uuid4(),
        administrator_id=uuid4(),
        token_hash="hash",
        created_at=now - timedelta(hours=1),
        last_seen_at=now - timedelta(minutes=31),
        idle_expires_at=now - timedelta(minutes=1),
        absolute_expires_at=now + timedelta(hours=11),
    )
    assert datetime.now(UTC) >= session.idle_expires_at


def test_inactive_administrator_flag():
    admin = Administrator(
        id=uuid4(),
        email="test@example.com",
        password_hash="hash",
        is_active=False,
        created_at=datetime.now(UTC),
        created_by="test",
    )
    assert admin.is_active is False
