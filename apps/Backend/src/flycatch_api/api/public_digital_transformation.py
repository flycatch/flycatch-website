from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_digital_transformation import (
    PublicDigitalTransformation,
    PublicDigitalTransformationList,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.digital_transformation_service import DigitalTransformationService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/public/digital-transformation", tags=["public-digital-transformation"])
_entries = DigitalTransformationService()


@router.get("", response_model=PublicDigitalTransformationList)
def list_public_digital_transformation(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _entries.list_published(db, q, page, per_page)


@router.get("/{slug}", response_model=PublicDigitalTransformation)
def get_public_digital_transformation(slug: str, db: Session = Depends(get_db)):
    try:
        return _entries.get_published_by_slug(db, slug)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
