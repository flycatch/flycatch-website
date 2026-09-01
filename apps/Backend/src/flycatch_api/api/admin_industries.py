from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.models import Industry as BulkModel
from flycatch_api.schemas.admin_case_studies import Industry, IndustryList, IndustryWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, IndustryService

router = APIRouter(prefix="/admin/industries", tags=["admin-industries"])
_industries = IndustryService()
RESOURCE = "industries"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=IndustryList)
def list_industries(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _industries.list_industries(db, q, page, per_page)


@router.post("", response_model=Industry, status_code=status.HTTP_201_CREATED)
def create_industry(
    payload: IndustryWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _industries.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{industry_id}", response_model=Industry)
def get_industry(industry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _industries.get(db, industry_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{industry_id}", response_model=Industry)
def update_industry(
    industry_id: UUID,
    payload: IndustryWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _industries.update(db, industry_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{industry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_industry(industry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _industries.delete(db, industry_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

attach_bulk_routes(router, resource=RESOURCE, model=BulkModel, not_found_key='admin.industries.not_found')
