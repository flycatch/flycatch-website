from typing import Annotated
from urllib.parse import urlencode
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from flycatch_api.config import settings
from flycatch_api.db import get_db
from flycatch_api.models import Administrator, AdminSession
from flycatch_api.schemas import (
    AuthError,
    RefreshRequest,
    SessionContext,
    SignInRequest,
    SignOutRequest,
    TokenPair,
)
from flycatch_api.schemas.admin_auth import MicrosoftSignInAvailability
from flycatch_api.security.dependencies import CurrentSession
from flycatch_api.security.jwt import JwtError, decode_access_token_allow_expired
from flycatch_api.security.oauth_state import COOKIE_MAX_AGE, COOKIE_NAME, COOKIE_PATH
from flycatch_api.services.auth_service import AuthService
from flycatch_api.services.microsoft_auth import MicrosoftAuthService, MicrosoftSignInRejected

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])
_auth = AuthService()
_microsoft = MicrosoftAuthService()


def _raise_auth(error: AuthError) -> None:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error.model_dump())


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def _sign_in_error_url() -> str:
    origin = settings.public_origin.rstrip("/")
    return f"{origin}/admin/sign-in/?error=admin.sign_in.error"


def _failure_redirect(*, clear_cookie: bool) -> RedirectResponse:
    response = RedirectResponse(_sign_in_error_url(), status_code=status.HTTP_302_FOUND)
    if clear_cookie:
        response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH)
    return response


def _success_redirect(pair: TokenPair) -> RedirectResponse:
    origin = settings.public_origin.rstrip("/")
    fragment = urlencode(
        {
            "access_token": pair.access_token,
            "refresh_token": pair.refresh_token,
            "expires_in": pair.expires_in,
        }
    )
    response = RedirectResponse(
        f"{origin}/admin/sign-in/microsoft/#{fragment}",
        status_code=status.HTTP_302_FOUND,
    )
    response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH)
    return response


@router.get("/microsoft", response_model=None)
def admin_microsoft_start(probe: Annotated[str | None, Query()] = None):
    if probe == "1":
        return MicrosoftSignInAvailability(configured=settings.microsoft_sign_in_configured())
    try:
        url, cookie = _microsoft.authorize_redirect()
    except MicrosoftSignInRejected:
        return _failure_redirect(clear_cookie=False)
    response = RedirectResponse(url, status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        COOKIE_NAME,
        cookie,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        path=COOKIE_PATH,
        secure=settings.public_origin.startswith("https://"),
    )
    return response


@router.get("/microsoft/callback", response_model=None)
def admin_microsoft_callback(
    request: Request,
    code: Annotated[str | None, Query()] = None,
    state: Annotated[str | None, Query()] = None,
    error: Annotated[str | None, Query()] = None,
    db: Session = Depends(get_db),
):
    if error or not code or not state:
        return _failure_redirect(clear_cookie=True)
    try:
        pair = _microsoft.complete(
            db,
            code=code,
            state=state,
            cookie=request.cookies.get(COOKIE_NAME),
        )
    except MicrosoftSignInRejected:
        return _failure_redirect(clear_cookie=True)
    return _success_redirect(pair)


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
