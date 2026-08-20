from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_client_testimonials import PublicClientTestimonialList
from flycatch_api.services.client_testimonial_service import ClientTestimonialService

router = APIRouter(prefix="/public/client-testimonials", tags=["public-client-testimonials"])
_testimonials = ClientTestimonialService()


@router.get("", response_model=PublicClientTestimonialList)
def list_public_client_testimonials(db: Session = Depends(get_db)):
    return _testimonials.list_published(db)
