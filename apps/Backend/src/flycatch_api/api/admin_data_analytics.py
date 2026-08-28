from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.models.data_analytics import DataAnalytics
from flycatch_api.schemas.admin_named_pages import DataAnalytic as DataAnalyticSchema
from flycatch_api.schemas.admin_named_pages import DataAnalyticList, DataAnalyticWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.named_page_service import NamedPageService
from flycatch_api.services.page_names import DATA_PAGE_NAMES

router = APIRouter(prefix="/admin/data-analytics", tags=["admin-data-analytics"])
_entries = NamedPageService(
    DataAnalytics,
    "admin.data_analytics.not_found",
    "public.data_analytics.not_found",
    DATA_PAGE_NAMES,
)
RESOURCE = "data_analytics"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=DataAnalyticList)
def list_data_analytics(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _entries.list_entries(db, q, page, per_page)


@router.post("", response_model=DataAnalyticSchema, status_code=status.HTTP_201_CREATED)
def create_data_analytic(
    payload: DataAnalyticWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _entries.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{entry_id}", response_model=DataAnalyticSchema)
def get_data_analytic(entry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _entries.get(db, entry_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{entry_id}", response_model=DataAnalyticSchema)
def update_data_analytic(
    entry_id: UUID,
    payload: DataAnalyticWrite,
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
def delete_data_analytic(entry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _entries.delete(db, entry_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
