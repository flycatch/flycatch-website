from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas import NotImplementedResponse
from flycatch_api.schemas import public_catalog as public
from flycatch_api.api.catalog import _raise
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.catalog_service import contact_service, subscription_service

router = APIRouter(tags=["stub"])


@router.post(
    "/public/forms/{form_id}/submissions",
    response_model=public.PublicContact,
    status_code=status.HTTP_201_CREATED,
)
def submit_public_form(
    form_id: str,
    payload: public.PublicContactWrite,
    db: Session = Depends(get_db),
):
    if form_id in {"contact", "contacts"}:
        try:
            return contact_service.submit(db, payload)
        except CatalogError as error:
            _raise(error)
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=NotImplementedResponse(message_key="stub.not_implemented").model_dump(),
    )


@router.post(
    "/public/newsletter/signup",
    response_model=public.PublicSubscription,
    status_code=status.HTTP_201_CREATED,
)
def newsletter_signup(payload: public.PublicSubscriptionWrite, db: Session = Depends(get_db)):
    try:
        return subscription_service.subscribe(db, payload)
    except CatalogError as error:
        _raise(error)
