from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_case_studies import PublicCaseStudyDetail, PublicCaseStudyList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.case_study_service import CaseStudyService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/public/case-studies", tags=["public-case-studies"])
_case_studies = CaseStudyService()


@router.get("", response_model=PublicCaseStudyList)
def list_public_case_studies(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _case_studies.list_published(db, q, page, per_page)


@router.get("/{slug}", response_model=PublicCaseStudyDetail)
def get_public_case_study(slug: str, db: Session = Depends(get_db)):
    try:
        return _case_studies.get_published_by_slug(db, slug)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
