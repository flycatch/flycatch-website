from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_client_logos import PublicClientLogoList
from flycatch_api.services.client_logo_service import ClientLogoService

router = APIRouter(prefix="/public/client-logos", tags=["public-client-logos"])
_logos = ClientLogoService()


@router.get("", response_model=PublicClientLogoList)
def list_public_client_logos(db: Session = Depends(get_db)):
    return _logos.list_published(db)
