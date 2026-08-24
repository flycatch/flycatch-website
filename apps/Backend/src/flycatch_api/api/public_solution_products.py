from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_solution_products import (
    PublicSolutionProduct,
    PublicSolutionProductList,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.solution_product_service import SolutionProductService

router = APIRouter(prefix="/public/solution-products", tags=["public-solution-products"])
_products = SolutionProductService()


@router.get("", response_model=PublicSolutionProductList)
def list_public_solution_products(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _products.list_published(db, q, page, per_page)


@router.get("/{slug}", response_model=PublicSolutionProduct)
def get_public_solution_product(slug: str, db: Session = Depends(get_db)):
    try:
        return _products.get_published_by_slug(db, slug)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
