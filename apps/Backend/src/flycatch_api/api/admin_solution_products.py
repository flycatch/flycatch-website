from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_solution_products import (
    SolutionProduct,
    SolutionProductList,
    SolutionProductWrite,
)
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.solution_product_service import SolutionProductService

router = APIRouter(prefix="/admin/solution-products", tags=["admin-solution-products"])
_products = SolutionProductService()
RESOURCE = "solution_products"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=SolutionProductList)
def list_solution_products(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _products.list_products(db, q, page, per_page)


@router.post("", response_model=SolutionProduct, status_code=status.HTTP_201_CREATED)
def create_solution_product(
    payload: SolutionProductWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _products.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{product_id}", response_model=SolutionProduct)
def get_solution_product(product_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _products.get(db, product_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{product_id}", response_model=SolutionProduct)
def update_solution_product(
    product_id: UUID,
    payload: SolutionProductWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _products.update(db, product_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_solution_product(
    product_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _products.delete(db, product_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
