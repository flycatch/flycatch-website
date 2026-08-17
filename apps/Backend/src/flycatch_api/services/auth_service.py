from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from flycatch_api.models import (
    AdminSession,
    Administrator,
    AdministratorRole,
    Role,
)
from flycatch_api.schemas import AuthError, SessionContext, SignInRequest, TokenPair
from flycatch_api.security.jwt import access_expires_in_seconds, issue_access_token
from flycatch_api.security.password import hash_password, verify_password
from flycatch_api.security.session import (
    generate_session_token,
    hash_token,
    session_absolute_expiry,
    session_idle_expiry,
    ensure_utc,
)
from flycatch_api.services.rbac_service import RbacService

_rbac = RbacService()


class AuthService:
    INVALID_CREDENTIALS = AuthError(
        code="invalid_credentials", message_key="admin.sign_in.error"
    )
    UNAUTHENTICATED = AuthError(code="unauthenticated", message_key="admin.sign_in.error")

    def session_context(self, db: Session, admin: Administrator, session: AdminSession) -> SessionContext:
        return SessionContext(
            administrator_id=admin.id,
            email=admin.email,
            roles=_rbac.role_names(db, admin.id),
            permissions=_rbac.permissions(db, admin.id),
            idle_expires_at=session.idle_expires_at,
            absolute_expires_at=session.absolute_expires_at,
        )

    def issue_token_pair(
        self,
        db: Session,
        admin: Administrator,
        family_id: UUID | None = None,
        created_at: datetime | None = None,
        absolute_expires_at: datetime | None = None,
    ) -> TokenPair:
        refresh_token = generate_session_token()
        now = datetime.now(UTC)
        origin = created_at or now
        session = AdminSession(
            administrator_id=admin.id,
            refresh_token_hash=hash_token(refresh_token),
            family_id=family_id or uuid4(),
            created_at=origin,
            last_seen_at=now,
            idle_expires_at=session_idle_expiry(now),
            absolute_expires_at=absolute_expires_at or session_absolute_expiry(origin),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return TokenPair(
            access_token=issue_access_token(subject=admin.id, session_id=session.id),
            refresh_token=refresh_token,
            expires_in=access_expires_in_seconds(),
            session=self.session_context(db, admin, session),
        )

    def revoke_family(self, db: Session, family_id: UUID) -> None:
        now = datetime.now(UTC)
        db.query(AdminSession).filter(
            AdminSession.family_id == family_id,
            AdminSession.revoked_at.is_(None),
        ).update({"revoked_at": now}, synchronize_session=False)
        db.commit()

    def _active_session(self, session: AdminSession | None, now: datetime) -> bool:
        if not session or session.revoked_at is not None:
            return False
        return now < ensure_utc(session.idle_expires_at) and now < ensure_utc(
            session.absolute_expires_at
        )

    def sign_in(self, db: Session, payload: SignInRequest) -> TokenPair | AuthError:
        admin = (
            db.query(Administrator)
            .filter(Administrator.email == payload.email.lower())
            .first()
        )
        if not admin or not admin.is_active or not verify_password(admin.password_hash, payload.password):
            return self.INVALID_CREDENTIALS
        return self.issue_token_pair(db, admin)

    def refresh(self, db: Session, refresh_token: str) -> TokenPair | AuthError:
        token_hash = hash_token(refresh_token)
        session = (
            db.query(AdminSession)
            .filter(AdminSession.refresh_token_hash == token_hash)
            .first()
        )
        now = datetime.now(UTC)
        if not session:
            return self.UNAUTHENTICATED
        if session.revoked_at is not None:
            self.revoke_family(db, session.family_id)
            return self.UNAUTHENTICATED
        if not self._active_session(session, now):
            return self.UNAUTHENTICATED

        admin = db.get(Administrator, session.administrator_id)
        if not admin or not admin.is_active:
            return self.UNAUTHENTICATED

        session.revoked_at = now
        db.commit()
        return self.issue_token_pair(
            db,
            admin,
            family_id=session.family_id,
            created_at=session.created_at,
            absolute_expires_at=session.absolute_expires_at,
        )

    def sign_out(
        self,
        db: Session,
        session: AdminSession | None = None,
        refresh_token: str | None = None,
    ) -> AuthError | None:
        now = datetime.now(UTC)
        target = session
        if target is None and refresh_token:
            target = (
                db.query(AdminSession)
                .filter(AdminSession.refresh_token_hash == hash_token(refresh_token))
                .first()
            )
        if target is None:
            return self.UNAUTHENTICATED
        if target.revoked_at is None:
            target.revoked_at = now
            db.commit()
        return None

    def provision_administrator(
        self,
        db: Session,
        email: str,
        password: str,
        created_by: str,
        role_name: str,
    ) -> Administrator:
        role = db.query(Role).filter(Role.name == role_name).first()
        if role is None:
            raise ValueError(f"Unknown role: {role_name}")
        admin = Administrator(
            email=email.lower(),
            password_hash=hash_password(password),
            is_active=True,
            created_at=datetime.now(UTC),
            created_by=created_by,
        )
        db.add(admin)
        db.flush()
        db.add(
            AdministratorRole(
                administrator_id=admin.id,
                role_id=role.id,
                assigned_at=datetime.now(UTC),
                assigned_by=created_by,
            )
        )
        db.commit()
        db.refresh(admin)
        return admin
