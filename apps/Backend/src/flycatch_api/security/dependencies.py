from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.models import AdminSession, Administrator, PermissionName
from flycatch_api.schemas import AuthError, PermissionDenied
from flycatch_api.security.jwt import JwtError, verify_access_token
from flycatch_api.security.session import ensure_utc, session_idle_expiry
from flycatch_api.services.rbac_service import RbacService

_rbac = RbacService()


def _auth_error(code: str, message_key: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=AuthError(code=code, message_key=message_key).model_dump(),
    )


def _permission_denied(permission: PermissionName) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=PermissionDenied(permission=permission).model_dump(mode="json"),
    )


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def get_current_session(
    request: Request,
    db: Session = Depends(get_db),
    authorization: Annotated[str | None, Header()] = None,
) -> AdminSession:
    token = _extract_bearer(authorization)
    if not token:
        raise _auth_error("unauthenticated", "admin.sign_in.error")

    try:
        payload = verify_access_token(token)
    except JwtError as exc:
        raise _auth_error("unauthenticated", "admin.sign_in.error") from exc

    try:
        session_id = UUID(str(payload["sid"]))
        administrator_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError) as exc:
        raise _auth_error("unauthenticated", "admin.sign_in.error") from exc

    session = db.get(AdminSession, session_id)
    if not session or session.administrator_id != administrator_id or session.revoked_at is not None:
        raise _auth_error("unauthenticated", "admin.sign_in.error")

    now = datetime.now(UTC)
    if now >= ensure_utc(session.idle_expires_at) or now >= ensure_utc(session.absolute_expires_at):
        raise _auth_error("unauthenticated", "admin.session.expired")

    admin = db.get(Administrator, session.administrator_id)
    if not admin or not admin.is_active:
        raise _auth_error("unauthenticated", "admin.sign_in.error")

    session.last_seen_at = now
    session.idle_expires_at = session_idle_expiry(now)
    db.commit()
    request.state.administrator = admin
    request.state.session = session
    return session


def require_permission(permission: PermissionName):
    def _require(
        session: Annotated[AdminSession, Depends(get_current_session)],
        db: Session = Depends(get_db),
    ) -> AdminSession:
        if not _rbac.has_permission(db, session.administrator_id, permission):
            raise _permission_denied(permission)
        return session

    return _require


CurrentSession = Annotated[AdminSession, Depends(get_current_session)]
RequireView = Annotated[AdminSession, Depends(require_permission(PermissionName.records_view))]
RequireDraft = Annotated[AdminSession, Depends(require_permission(PermissionName.drafts_save))]
RequirePublish = Annotated[
    AdminSession, Depends(require_permission(PermissionName.records_publish))
]
RequireRoles = Annotated[AdminSession, Depends(require_permission(PermissionName.roles_manage))]
