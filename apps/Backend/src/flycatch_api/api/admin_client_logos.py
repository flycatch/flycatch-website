from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.models import ClientLogo as BulkModel
from flycatch_api.schemas.admin_client_logos import ClientLogo, ClientLogoList, ClientLogoWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.client_logo_service import ClientLogoService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/admin/client-logos", tags=["admin-client-logos"])
_logos = ClientLogoService()
RESOURCE = "client_logos"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=ClientLogoList)
def list_client_logos(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _logos.list_logos(db, q, page, per_page)


@router.post("", response_model=ClientLogo, status_code=status.HTTP_201_CREATED)
def create_client_logo(
    payload: ClientLogoWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _logos.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{logo_id}", response_model=ClientLogo)
def get_client_logo(logo_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _logos.get(db, logo_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{logo_id}", response_model=ClientLogo)
def update_client_logo(
    logo_id: UUID,
    payload: ClientLogoWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _logos.update(db, logo_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{logo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_logo(logo_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _logos.delete(db, logo_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

attach_bulk_routes(router, resource=RESOURCE, model=BulkModel, not_found_key='admin.client_logos.not_found')
