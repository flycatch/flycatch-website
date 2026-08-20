from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_case_studies import PublicTechnologyList
from flycatch_api.services.technology_service import TechnologyService

router = APIRouter(prefix="/public/technologies", tags=["public-technologies"])
_technologies = TechnologyService()


@router.get("", response_model=PublicTechnologyList)
def list_public_technologies(db: Session = Depends(get_db)):
    return _technologies.list_published(db)
