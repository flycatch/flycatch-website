from __future__ import annotations

import uuid
from io import BytesIO

from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_blogs import EntityNotFound, MediaObject
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.object_storage import ObjectStorageService
from flycatch_api.services.text import is_valid_media_key

IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}
DOCUMENT_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}
ALLOWED_TYPES = {**IMAGE_TYPES, **VIDEO_TYPES, **DOCUMENT_TYPES}
IMAGE_MAX_BYTES = 5 * 1024 * 1024
VIDEO_MAX_BYTES = 50 * 1024 * 1024
DOCUMENT_MAX_BYTES = 10 * 1024 * 1024


class MediaService:
    def __init__(self, storage: ObjectStorageService | None = None) -> None:
        self._storage = storage

    @property
    def storage(self) -> ObjectStorageService:
        if self._storage is None:
            self._storage = ObjectStorageService()
        return self._storage

    def upload(self, _filename: str | None, content_type: str | None, data: bytes) -> MediaObject:
        if not data:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"file": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        normalized = (content_type or "").lower()
        extension = ALLOWED_TYPES.get(normalized)
        if extension is None:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"file": FieldErrorDetail(message_key="admin.media.type.invalid")}
                ).model_dump(),
            )
        if normalized in VIDEO_TYPES:
            limit = VIDEO_MAX_BYTES
        elif normalized in DOCUMENT_TYPES:
            limit = DOCUMENT_MAX_BYTES
        else:
            limit = IMAGE_MAX_BYTES
        if len(data) > limit:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"file": FieldErrorDetail(message_key="admin.media.too_large")}
                ).model_dump(),
            )
        key = f"{uuid.uuid4().hex}{extension}"
        self.storage.put_bytes(key, data, content_type or "application/octet-stream")
        return MediaObject(key=key)

    def get(self, key: str) -> tuple[BytesIO, str]:
        if not is_valid_media_key(key):
            raise CatalogError(
                404, EntityNotFound(message_key="admin.media.not_found").model_dump()
            )
        result = self.storage.get_bytes(key)
        if result is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.media.not_found").model_dump()
            )
        body, content_type = result
        return BytesIO(body), content_type
