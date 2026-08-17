from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_roles import RoleCatalogue, RoleDetail, RoleList, RoleWrite
from flycatch_api.security.dependencies import RequireRoles
from flycatch_api.services.role_service import PER_PAGE, RoleError, RoleService

router = APIRouter(prefix="/admin/roles", tags=["admin-roles"])
_roles = RoleService()


def _raise_role_error(error: RoleError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=RoleList)
def list_roles(
    _session: RequireRoles,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _roles.list_roles(db, q, page, per_page)


@router.get("/catalogue", response_model=RoleCatalogue)
def get_role_catalogue(_session: RequireRoles, db: Session = Depends(get_db)):
    return _roles.catalogue(db)


@router.post("", response_model=RoleDetail, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleWrite, _session: RequireRoles, db: Session = Depends(get_db)):
    try:
        return _roles.create(db, payload)
    except RoleError as error:
        _raise_role_error(error)


@router.get("/{role_id}", response_model=RoleDetail)
def get_role(role_id: UUID, _session: RequireRoles, db: Session = Depends(get_db)):
    try:
        return _roles.get(db, role_id)
    except RoleError as error:
        _raise_role_error(error)


@router.patch("/{role_id}", response_model=RoleDetail)
def update_role(
    role_id: UUID, payload: RoleWrite, _session: RequireRoles, db: Session = Depends(get_db)
):
    try:
        return _roles.update(db, role_id, payload)
    except RoleError as error:
        _raise_role_error(error)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: UUID, _session: RequireRoles, db: Session = Depends(get_db)):
    try:
        _roles.delete(db, role_id)
    except RoleError as error:
        _raise_role_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
