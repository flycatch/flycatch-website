from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.models.data_analytics import DataAnalytics
from flycatch_api.schemas.public_named_pages import PublicDataAnalytic, PublicDataAnalyticList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.named_page_service import NamedPageService
from flycatch_api.services.page_names import DATA_PAGE_NAMES

router = APIRouter(prefix="/public/data-analytics", tags=["public-data-analytics"])
_entries = NamedPageService(
    DataAnalytics,
    "admin.data_analytics.not_found",
    "public.data_analytics.not_found",
    DATA_PAGE_NAMES,
)


@router.get("", response_model=PublicDataAnalyticList)
def list_public_data_analytics(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _entries.list_published(db, q, page, per_page)


@router.get("/{page_name}", response_model=PublicDataAnalytic)
def get_public_data_analytic(page_name: str, db: Session = Depends(get_db)):
    try:
        return _entries.get_published_by_page_name(db, page_name)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
