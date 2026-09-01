from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.models import Home as BulkModel
from flycatch_api.schemas.admin_homes import Home, HomeList, HomeWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.home_service import HomeService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/admin/homes", tags=["admin-homes"])
_homes = HomeService()
RESOURCE = "home"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=HomeList)
def list_homes(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _homes.list_homes(db, q, page, per_page)


@router.post("", response_model=Home, status_code=status.HTTP_201_CREATED)
def create_home(payload: HomeWrite, session: CurrentSession, db: Session = Depends(get_db)):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _homes.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{home_id}", response_model=Home)
def get_home(home_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _homes.get(db, home_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{home_id}", response_model=Home)
def update_home(
    home_id: UUID,
    payload: HomeWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _homes.update(db, home_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{home_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_home(home_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _homes.delete(db, home_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

attach_bulk_routes(router, resource=RESOURCE, model=BulkModel, not_found_key='admin.homes.not_found')
