from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from flycatch_api.models import AdminSession, Administrator, ManagedRecord, RecordType
from flycatch_api.schemas import AuthError, SessionResponse, SignInRequest
from flycatch_api.security.password import hash_password, verify_password
from flycatch_api.security.session import (
    generate_session_token,
    hash_token,
    session_absolute_expiry,
    session_idle_expiry,
)


class AuthService:
    INVALID_CREDENTIALS = AuthError(
        code="invalid_credentials", message_key="admin.sign_in.error"
    )

    def sign_in(
        self, db: Session, payload: SignInRequest
    ) -> tuple[str, SessionResponse] | AuthError:
        admin = (
            db.query(Administrator)
            .filter(Administrator.email == payload.email.lower())
            .first()
        )
        if not admin or not admin.is_active or not verify_password(admin.password_hash, payload.password):
            return self.INVALID_CREDENTIALS

        token = generate_session_token()
        now = datetime.now(UTC)
        session = AdminSession(
            administrator_id=admin.id,
            token_hash=hash_token(token),
            created_at=now,
            last_seen_at=now,
            idle_expires_at=session_idle_expiry(now),
            absolute_expires_at=session_absolute_expiry(now),
        )
        db.add(session)
        db.commit()
        return token, SessionResponse(
            administrator_id=admin.id,
            email=admin.email,
            idle_expires_at=session.idle_expires_at,
        )

    def sign_out(self, db: Session, session: AdminSession) -> None:
        session.revoked_at = datetime.now(UTC)
        db.commit()

    def provision_administrator(
        self, db: Session, email: str, password: str, created_by: str
    ) -> Administrator:
        admin = Administrator(
            email=email.lower(),
            password_hash=hash_password(password),
            is_active=True,
            created_at=datetime.now(UTC),
            created_by=created_by,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return admin
