from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_case_studies import PublicIndustryList
from flycatch_api.services.industry_service import IndustryService

router = APIRouter(prefix="/public/industries", tags=["public-industries"])
_industries = IndustryService()


@router.get("", response_model=PublicIndustryList)
def list_public_industries(db: Session = Depends(get_db)):
    return _industries.list_published(db)
