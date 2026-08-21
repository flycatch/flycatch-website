from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_homes import PublicHomeList
from flycatch_api.services.home_service import HomeService

router = APIRouter(prefix="/public/homes", tags=["public-homes"])
_homes = HomeService()


@router.get("", response_model=PublicHomeList)
def list_public_homes(db: Session = Depends(get_db)):
    return _homes.list_published(db)
