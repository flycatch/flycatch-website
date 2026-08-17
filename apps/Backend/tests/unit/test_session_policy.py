from datetime import UTC, datetime, timedelta
from uuid import uuid4

from flycatch_api.config import settings
from flycatch_api.models import AdminSession, Administrator
from flycatch_api.security.jwt import issue_access_token, verify_access_token
from flycatch_api.security.session import session_idle_expiry


def test_idle_session_expired():
    now = datetime.now(UTC)
    session = AdminSession(
        id=uuid4(),
        administrator_id=uuid4(),
        refresh_token_hash="hash",
        family_id=uuid4(),
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


def test_idle_expiry_helper_is_thirty_minutes():
    now = datetime.now(UTC)
    expiry = session_idle_expiry(now)
    assert expiry - now == timedelta(minutes=settings.session_idle_minutes)


def test_access_jwt_has_identity_claims_only():
    subject = uuid4()
    session_id = uuid4()
    token = issue_access_token(subject=subject, session_id=session_id)
    payload = verify_access_token(token)
    assert payload["sub"] == str(subject)
    assert payload["sid"] == str(session_id)
    assert payload["typ"] == "access"
    assert "roles" not in payload
    assert "permissions" not in payload
    assert "jti" in payload
    assert "exp" in payload
