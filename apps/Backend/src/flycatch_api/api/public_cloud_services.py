from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.models.cloud_service import CloudService
from flycatch_api.schemas.public_named_pages import PublicCloudService, PublicCloudServiceList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.named_page_service import NamedPageService

router = APIRouter(prefix="/public/cloud-services", tags=["public-cloud-services"])
_entries = NamedPageService(
    CloudService, "admin.cloud_services.not_found", "public.cloud_services.not_found"
)


@router.get("", response_model=PublicCloudServiceList)
def list_public_cloud_services(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _entries.list_published(db, q, page, per_page)


@router.get("/{page_name}", response_model=PublicCloudService)
def get_public_cloud_service(page_name: str, db: Session = Depends(get_db)):
    try:
        return _entries.get_published_by_page_name(db, page_name)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
