import hashlib

from fastapi import APIRouter, HTTPException, Request, Response

from flycatch_api.schemas.admin_blogs import EntityNotFound
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.media_service import MediaService

router = APIRouter(prefix="/public/media", tags=["public-media"])
_media = MediaService()

MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable"


def media_etag(body: bytes) -> str:
    return f'"{hashlib.sha256(body).hexdigest()}"'


def media_headers(body: bytes, content_type: str) -> dict[str, str]:
    return {
        "Cache-Control": MEDIA_CACHE_CONTROL,
        "ETag": media_etag(body),
        "Content-Type": content_type,
        "Content-Length": str(len(body)),
    }


@router.api_route("/{media_key}", methods=["GET", "HEAD"])
def get_public_media(media_key: str, request: Request):
    try:
        stream, content_type = _media.get(media_key)
    except CatalogError as error:
        if error.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=EntityNotFound(message_key="public.media.not_found").model_dump(),
            ) from error
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
    body = stream.read()
    headers = media_headers(body, content_type)
    if request.headers.get("if-none-match") == headers["ETag"]:
        return Response(
            status_code=304,
            headers={"Cache-Control": headers["Cache-Control"], "ETag": headers["ETag"]},
        )
    if request.method == "HEAD":
        return Response(status_code=200, headers=headers)
    return Response(content=body, status_code=200, headers=headers)
