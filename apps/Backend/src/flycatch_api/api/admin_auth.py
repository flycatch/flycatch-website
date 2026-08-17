from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.models import AdminSession, Administrator
from flycatch_api.schemas import (
    AuthError,
    RefreshRequest,
    SessionContext,
    SignInRequest,
    SignOutRequest,
    TokenPair,
)
from flycatch_api.security.dependencies import CurrentSession
from flycatch_api.security.jwt import JwtError, decode_access_token_allow_expired
from flycatch_api.services.auth_service import AuthService

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])
_auth = AuthService()


def _raise_auth(error: AuthError) -> None:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error.model_dump())


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


@router.post("/sign-in", response_model=TokenPair)
def admin_sign_in(payload: SignInRequest, db: Session = Depends(get_db)):
    result = _auth.sign_in(db, payload)
    if isinstance(result, AuthError):
        _raise_auth(result)
    return result


@router.post("/refresh", response_model=TokenPair)
def admin_refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    result = _auth.refresh(db, payload.refresh_token)
    if isinstance(result, AuthError):
        _raise_auth(result)
    return result


@router.post("/sign-out", status_code=status.HTTP_204_NO_CONTENT)
def admin_sign_out(
    payload: SignOutRequest | None = None,
    db: Session = Depends(get_db),
    authorization: Annotated[str | None, Header()] = None,
):
    session: AdminSession | None = None
    token = _extract_bearer(authorization)
    if token:
        try:
            claims = decode_access_token_allow_expired(token)
            session = db.get(AdminSession, UUID(str(claims["sid"])))
        except (JwtError, ValueError):
            session = None
    refresh_token = payload.refresh_token if payload else None
    error = _auth.sign_out(db, session=session, refresh_token=refresh_token)
    if error:
        _raise_auth(error)


@router.get("/session", response_model=SessionContext)
def admin_session(session: CurrentSession, db: Session = Depends(get_db)):
    admin = db.get(Administrator, session.administrator_id)
    if not admin or not admin.is_active:
        _raise_auth(_auth.UNAUTHENTICATED)
    return _auth.session_context(db, admin, session)
