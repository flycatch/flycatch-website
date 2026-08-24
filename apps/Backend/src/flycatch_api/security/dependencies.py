from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any
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


def _permission_value(permission: PermissionName | str) -> str:
    return permission.value if isinstance(permission, PermissionName) else permission


def _permission_denied(permission: PermissionName | str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=PermissionDenied(permission=_permission_value(permission)).model_dump(mode="json"),
    )


def assert_permission(
    db: Session, administrator_id: UUID, permission: PermissionName | str
) -> None:
    if not _rbac.has_permission(db, administrator_id, permission):
        raise _permission_denied(permission)


def is_publish_status(value: Any) -> bool:
    if value is None:
        return False
    raw = getattr(value, "value", value)
    return str(raw) == "publish"


def assert_resource_action(
    db: Session, administrator_id: UUID, resource: str, action: str
) -> None:
    assert_permission(db, administrator_id, f"{resource}.{action}")


def assert_write_permissions(
    db: Session,
    administrator_id: UUID,
    resource: str,
    *,
    action: str,
    status_value: Any = None,
) -> None:
    assert_resource_action(db, administrator_id, resource, action)
    if is_publish_status(status_value):
        assert_resource_action(db, administrator_id, resource, "publish")


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


def require_permission(permission: PermissionName | str):
    required = _permission_value(permission)

    def _require(
        session: Annotated[AdminSession, Depends(get_current_session)],
        db: Session = Depends(get_db),
    ) -> AdminSession:
        assert_permission(db, session.administrator_id, required)
        return session

    return _require


CurrentSession = Annotated[AdminSession, Depends(get_current_session)]
RequireView = Annotated[AdminSession, Depends(require_permission(PermissionName.records_view))]
RequireDraft = Annotated[AdminSession, Depends(require_permission(PermissionName.drafts_save))]
RequirePublish = Annotated[
    AdminSession, Depends(require_permission(PermissionName.records_publish))
]
RequireRoles = Annotated[AdminSession, Depends(require_permission(PermissionName.roles_manage))]
