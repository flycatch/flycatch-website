from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_blogs import Category, CategoryList, CategoryWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.category_service import CategoryService

router = APIRouter(prefix="/admin/categories", tags=["admin-categories"])
_categories = CategoryService()
RESOURCE = "categories"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=CategoryList)
def list_categories(session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _categories.list_categories(db)


@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _categories.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{category_id}", response_model=Category)
def get_category(category_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _categories.get(db, category_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{category_id}", response_model=Category)
def update_category(
    category_id: UUID,
    payload: CategoryWrite,
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
def delete_category(category_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _categories.delete(db, category_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
