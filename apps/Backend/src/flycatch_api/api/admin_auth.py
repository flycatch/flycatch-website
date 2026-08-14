from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from flycatch_api.config import settings
from flycatch_api.db import get_db
from flycatch_api.schemas import AuthError, FieldErrors, SessionResponse, SignInRequest
from flycatch_api.security.dependencies import CurrentSession
from flycatch_api.services.auth_service import AuthService

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])
_auth = AuthService()


@router.post("/sign-in", status_code=status.HTTP_204_NO_CONTENT)
def admin_sign_in(payload: SignInRequest, response: Response, db: Session = Depends(get_db)):
    result = _auth.sign_in(db, payload)
    if isinstance(result, AuthError):
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=result.model_dump())
    token, _session = result
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.environment != "local",
        samesite="lax",
        path="/",
    )


@router.post("/sign-out", status_code=status.HTTP_204_NO_CONTENT)
def admin_sign_out(
    response: Response,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    _auth.sign_out(db, session)
    response.delete_cookie(key=settings.session_cookie_name, path="/")


@router.get("/session", response_model=SessionResponse)
def admin_session(session: CurrentSession, db: Session = Depends(get_db)):
    from flycatch_api.models import Administrator

    admin = db.get(Administrator, session.administrator_id)
    return SessionResponse(
        administrator_id=admin.id,
        email=admin.email,
        idle_expires_at=session.idle_expires_at,
    )
