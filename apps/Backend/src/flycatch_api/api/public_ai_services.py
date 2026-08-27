from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_ai_services import PublicAiService, PublicAiServiceList
from flycatch_api.services.ai_service_service import AiServiceService
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/public/ai-services", tags=["public-ai-services"])
_entries = AiServiceService()


@router.get("", response_model=PublicAiServiceList)
def list_public_ai_services(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _entries.list_published(db, q, page, per_page)


@router.get("/{slug}", response_model=PublicAiService)
def get_public_ai_service(slug: str, db: Session = Depends(get_db)):
    try:
        return _entries.get_published_by_slug(db, slug)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
