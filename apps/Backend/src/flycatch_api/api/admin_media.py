from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from flycatch_api.schemas.admin_blogs import MediaObject
from flycatch_api.security.dependencies import RequireDraft, RequireView
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.media_service import MediaService

router = APIRouter(prefix="/admin/media", tags=["admin-media"])
_media = MediaService()


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.post("", response_model=MediaObject, status_code=201)
async def upload_media(_session: RequireDraft, file: UploadFile = File(...)):
    data = await file.read()
    try:
        return _media.upload(file.filename, file.content_type, data)
    except CatalogError as error:
        _raise(error)


@router.get("/{media_key}")
def get_media(media_key: str, _session: RequireView):
    try:
        stream, content_type = _media.get(media_key)
    except CatalogError as error:
        _raise(error)
    return StreamingResponse(stream, media_type=content_type)
