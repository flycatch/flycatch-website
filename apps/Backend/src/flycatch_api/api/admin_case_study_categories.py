from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_case_studies import (
    CaseStudyCategory,
    CaseStudyCategoryList,
    CaseStudyCategoryWrite,
)
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.case_study_category_service import CaseStudyCategoryService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/admin/case-study-categories", tags=["admin-case-study-categories"])
_categories = CaseStudyCategoryService()
RESOURCE = "case_study_categories"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=CaseStudyCategoryList)
def list_case_study_categories(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _categories.list_categories(db, q, page, per_page)


@router.post("", response_model=CaseStudyCategory, status_code=status.HTTP_201_CREATED)
def create_case_study_category(
    payload: CaseStudyCategoryWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _categories.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{category_id}", response_model=CaseStudyCategory)
def get_case_study_category(
    category_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _categories.get(db, category_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{category_id}", response_model=CaseStudyCategory)
def update_case_study_category(
    category_id: UUID,
    payload: CaseStudyCategoryWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _categories.update(db, category_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case_study_category(
    category_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _categories.delete(db, category_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
