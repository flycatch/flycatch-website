from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_solution_details import PublicSolutionDetail, PublicSolutionDetailList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.solution_detail_service import SolutionDetailService

router = APIRouter(prefix="/public/solution-details", tags=["public-solution-details"])
_details = SolutionDetailService()


@router.get("", response_model=PublicSolutionDetailList)
def list_public_solution_details(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _details.list_published(db, q, page, per_page)


@router.get("/{slug}", response_model=PublicSolutionDetail)
def get_public_solution_detail(slug: str, db: Session = Depends(get_db)):
    try:
        return _details.get_published_by_slug(db, slug)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
