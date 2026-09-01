from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.models import CaseStudy as BulkModel
from flycatch_api.schemas.admin_case_studies import CaseStudyDetail, CaseStudyList, CaseStudyWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.case_study_service import CaseStudyService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/admin/case-studies", tags=["admin-case-studies"])
_case_studies = CaseStudyService()
RESOURCE = "case_studies"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=CaseStudyList)
def list_case_studies(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _case_studies.list_case_studies(db, q, page, per_page)


@router.post("", response_model=CaseStudyDetail, status_code=status.HTTP_201_CREATED)
def create_case_study(
    payload: CaseStudyWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _case_studies.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{case_study_id}", response_model=CaseStudyDetail)
def get_case_study(case_study_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _case_studies.get(db, case_study_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{case_study_id}", response_model=CaseStudyDetail)
def update_case_study(
    case_study_id: UUID,
    payload: CaseStudyWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _case_studies.update(db, case_study_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{case_study_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case_study(
    case_study_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _case_studies.delete(db, case_study_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

attach_bulk_routes(router, resource=RESOURCE, model=BulkModel, not_found_key='admin.case_studies.not_found')
