from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from flycatch_api.schemas import NotImplementedResponse

router = APIRouter(tags=["stub"])


@router.post(
    "/public/forms/{form_id}/submissions",
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
def submit_public_form(form_id: str):
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=NotImplementedResponse(message_key="stub.not_implemented").model_dump(),
    )


@router.post("/public/newsletter/signup", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def newsletter_signup():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=NotImplementedResponse(message_key="stub.not_implemented").model_dump(),
    )
