from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.models import AiService as BulkModel
from flycatch_api.schemas.admin_ai_services import AiService, AiServiceList, AiServiceWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.ai_service_service import AiServiceService
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/admin/ai-services", tags=["admin-ai-services"])
_entries = AiServiceService()
RESOURCE = "ai_services"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=AiServiceList)
def list_ai_services(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _entries.list_entries(db, q, page, per_page)


@router.post("", response_model=AiService, status_code=status.HTTP_201_CREATED)
def create_ai_service(
    payload: AiServiceWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _entries.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{ai_service_id}", response_model=AiService)
def get_ai_service(ai_service_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _entries.get(db, ai_service_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{ai_service_id}", response_model=AiService)
def update_ai_service(
    ai_service_id: UUID,
    payload: AiServiceWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _entries.update(db, ai_service_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{ai_service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_service(ai_service_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _entries.delete(db, ai_service_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

attach_bulk_routes(router, resource=RESOURCE, model=BulkModel, not_found_key='admin.ai_services.not_found')
