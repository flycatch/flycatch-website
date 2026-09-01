from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.models import SolutionDetail as BulkModel
from flycatch_api.schemas.admin_solution_details import (
    SolutionDetail,
    SolutionDetailList,
    SolutionDetailWrite,
)
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.solution_detail_service import SolutionDetailService

router = APIRouter(prefix="/admin/solution-details", tags=["admin-solution-details"])
_details = SolutionDetailService()
RESOURCE = "solution_details"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=SolutionDetailList)
def list_solution_details(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _details.list_details(db, q, page, per_page)


@router.post("", response_model=SolutionDetail, status_code=status.HTTP_201_CREATED)
def create_solution_detail(
    payload: SolutionDetailWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _details.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{detail_id}", response_model=SolutionDetail)
def get_solution_detail(detail_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _details.get(db, detail_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{detail_id}", response_model=SolutionDetail)
def update_solution_detail(
    detail_id: UUID,
    payload: SolutionDetailWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _details.update(db, detail_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{detail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_solution_detail(
    detail_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _details.delete(db, detail_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

attach_bulk_routes(router, resource=RESOURCE, model=BulkModel, not_found_key='admin.solution_details.not_found')
