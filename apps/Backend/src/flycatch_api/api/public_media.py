from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from flycatch_api.schemas.admin_blogs import EntityNotFound
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.media_service import MediaService

router = APIRouter(prefix="/public/media", tags=["public-media"])
_media = MediaService()


@router.get("/{media_key}")
def get_public_media(media_key: str):
    try:
        stream, content_type = _media.get(media_key)
    except CatalogError as error:
        if error.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=EntityNotFound(message_key="public.media.not_found").model_dump(),
            ) from error
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
    return StreamingResponse(stream, media_type=content_type)
