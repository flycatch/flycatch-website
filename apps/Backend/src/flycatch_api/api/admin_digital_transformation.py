from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.models import DigitalTransformation as BulkModel
from flycatch_api.schemas.admin_digital_transformation import (
    DigitalTransformation,
    DigitalTransformationList,
    DigitalTransformationWrite,
)
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.digital_transformation_service import DigitalTransformationService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/admin/digital-transformation", tags=["admin-digital-transformation"])
_entries = DigitalTransformationService()
RESOURCE = "digital_transformation"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=DigitalTransformationList)
def list_digital_transformation(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _entries.list_entries(db, q, page, per_page)


@router.post("", response_model=DigitalTransformation, status_code=status.HTTP_201_CREATED)
def create_digital_transformation(
    payload: DigitalTransformationWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _entries.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{entry_id}", response_model=DigitalTransformation)
def get_digital_transformation(
    entry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _entries.get(db, entry_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{entry_id}", response_model=DigitalTransformation)
def update_digital_transformation(
    entry_id: UUID,
    payload: DigitalTransformationWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _entries.update(db, entry_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_digital_transformation(
    entry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _entries.delete(db, entry_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

attach_bulk_routes(router, resource=RESOURCE, model=BulkModel, not_found_key='admin.digital_transformation.not_found')
