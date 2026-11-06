from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.models import Administrator
from flycatch_api.schemas.admin_users import (
    UserBulkAssign,
    UserBulkAssignResult,
    UserCreate,
    UserList,
    UserSummary,
    UserUpdate,
)
from flycatch_api.security.dependencies import RequireRoles
from flycatch_api.services.role_service import RoleError
from flycatch_api.services.user_service import MAX_PER_PAGE, PER_PAGE, UserError, UserService

router = APIRouter(prefix="/admin/users", tags=["admin-users"])
role_members = APIRouter(prefix="/admin/roles", tags=["admin-users"])
_users = UserService()


def _raise(error: UserError | RoleError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


def _actor_email(db: Session, session) -> str:
    admin = db.get(Administrator, session.administrator_id)
    return admin.email if admin else str(session.administrator_id)


@router.get("", response_model=UserList)
def list_users(
    _session: RequireRoles,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=MAX_PER_PAGE),
    role_id: UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status", pattern="^(active|inactive)$"),
):
    return _users.list_users(db, q, page, per_page, role_id, status_filter)


@router.post("", response_model=UserSummary, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, session: RequireRoles, db: Session = Depends(get_db)):
    try:
        return _users.create(db, payload, _actor_email(db, session))
    except (UserError, RoleError) as error:
        _raise(error)


@router.post("/bulk-assign", response_model=UserBulkAssignResult)
def bulk_assign(payload: UserBulkAssign, session: RequireRoles, db: Session = Depends(get_db)):
    try:
        return _users.bulk_assign(
            db, payload, session.administrator_id, _actor_email(db, session)
        )
    except (UserError, RoleError) as error:
        _raise(error)


@router.get("/{user_id}", response_model=UserSummary)
def get_user(user_id: UUID, _session: RequireRoles, db: Session = Depends(get_db)):
    try:
        return _users.get(db, user_id)
    except UserError as error:
        _raise(error)


@router.patch("/{user_id}", response_model=UserSummary)
def update_user(
    user_id: UUID, payload: UserUpdate, session: RequireRoles, db: Session = Depends(get_db)
):
    try:
        return _users.update(
            db, user_id, payload, session.administrator_id, _actor_email(db, session)
        )
    except (UserError, RoleError) as error:
        _raise(error)


@role_members.get("/{role_id}/users", response_model=list[UserSummary])
def list_role_users(role_id: UUID, _session: RequireRoles, db: Session = Depends(get_db)):
    try:
        return _users.role_users(db, role_id)
    except (UserError, RoleError) as error:
        _raise(error)
