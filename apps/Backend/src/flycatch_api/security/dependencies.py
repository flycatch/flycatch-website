from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from flycatch_api.config import settings
from flycatch_api.db import get_db
from flycatch_api.models import AdminSession, Administrator
from flycatch_api.schemas import ActionDenied, AuthError
from flycatch_api.security.csrf import verify_csrf_token
from flycatch_api.security.session import hash_token, session_idle_expiry


def _auth_error(code: str, message_key: str, status_code: int) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail=AuthError(code=code, message_key=message_key).model_dump(),
    )


def get_current_session(
    request: Request,
    db: Session = Depends(get_db),
    session_cookie: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> AdminSession:
    if not session_cookie:
        raise _auth_error("unauthenticated", "admin.sign_in.error", status.HTTP_401_UNAUTHORIZED)

    token_hash = hash_token(session_cookie)
    session = (
        db.query(AdminSession)
        .filter(AdminSession.token_hash == token_hash, AdminSession.revoked_at.is_(None))
        .first()
    )
    if not session:
        raise _auth_error("unauthenticated", "admin.sign_in.error", status.HTTP_401_UNAUTHORIZED)

    now = datetime.now(UTC)
    if now >= session.idle_expires_at or now >= session.absolute_expires_at:
        raise _auth_error("unauthenticated", "admin.sign_in.error", status.HTTP_401_UNAUTHORIZED)

    admin = db.get(Administrator, session.administrator_id)
    if not admin or not admin.is_active:
        raise _auth_error("unauthenticated", "admin.sign_in.error", status.HTTP_401_UNAUTHORIZED)

    session.last_seen_at = now
    session.idle_expires_at = session_idle_expiry(now)
    db.commit()
    request.state.administrator = admin
    return session


def require_csrf(
    x_csrf_token: Annotated[str | None, Header(alias="X-CSRF-Token")] = None,
) -> None:
    if not x_csrf_token or not verify_csrf_token(x_csrf_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ActionDenied(code="csrf_failed", message_key="admin.csrf.failed").model_dump(),
        )


CurrentSession = Annotated[AdminSession, Depends(get_current_session)]
