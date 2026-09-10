from __future__ import annotations

import logging
import mimetypes
from typing import Any, Protocol

from flycatch_api.import_strapi.client import StrapiClient, media_file
from flycatch_api.services.media_service import MediaService

logger = logging.getLogger(__name__)


class MediaUploader(Protocol):
    def upload(self, filename: str | None, content_type: str | None, data: bytes) -> Any: ...


class MediaImporter:
    """Download Strapi media and upload into MinIO via MediaService."""

    def __init__(
        self,
        client: StrapiClient,
        *,
        dry_run: bool = False,
        uploader: MediaUploader | None = None,
    ) -> None:
        self.client = client
        self.dry_run = dry_run
        self._uploader = uploader
        self._cache: dict[int, str] = {}
        self._url_cache: dict[str, str] = {}
        self.uploaded = 0
        self.skipped = 0
        self.errors: list[str] = []

    @property
    def uploader(self) -> MediaUploader:
        if self._uploader is None:
            self._uploader = MediaService()
        return self._uploader

    def import_field(self, value: Any) -> str | None:
        # Some Flycatch Strapi fields store a bare URL string instead of a media relation.
        if isinstance(value, str) and value.strip():
            return self.import_file({"url": value.strip()})
        file_meta = media_file(value)
        if not file_meta:
            return None
        return self.import_file(file_meta)

    def guess_content_type(self, value: Any) -> str | None:
        if isinstance(value, str) and value.strip():
            return mimetypes.guess_type(value.strip())[0]
        file_meta = media_file(value) or {}
        mime = file_meta.get("mime") or file_meta.get("content_type")
        if isinstance(mime, str) and mime.strip():
            return mime.split(";")[0].strip().lower()
        url = file_meta.get("url")
        if isinstance(url, str):
            return mimetypes.guess_type(url)[0]
        return None

    def import_file(self, file_meta: dict[str, Any]) -> str | None:
        file_id = file_meta.get("id")
        if isinstance(file_id, int) and file_id in self._cache:
            return self._cache[file_id]

        url = file_meta.get("url")
        absolute = self.client.absolute_url(url if isinstance(url, str) else None)
        if not absolute:
            self.skipped += 1
            return None
        if absolute in self._url_cache:
            key = self._url_cache[absolute]
            if isinstance(file_id, int):
                self._cache[file_id] = key
            return key

        mime = file_meta.get("mime") or file_meta.get("content_type")
        filename = file_meta.get("name") or file_meta.get("hash") or absolute.rsplit("/", 1)[-1]
        if self.dry_run:
            key = f"dry-run-{file_id or abs(hash(absolute))}"
            if isinstance(file_id, int):
                self._cache[file_id] = key
            self._url_cache[absolute] = key
            self.uploaded += 1
            return key

        try:
            data, response_type = self.client.download_bytes(absolute)
            content_type = (
                (mime if isinstance(mime, str) else None)
                or response_type
                or mimetypes.guess_type(str(filename))[0]
                or "application/octet-stream"
            )
            content_type = content_type.split(";")[0].strip().lower()
            result = self.uploader.upload(str(filename) if filename else None, content_type, data)
            key = result.key if hasattr(result, "key") else str(result)
        except Exception as exc:  # noqa: BLE001 — collect and continue import
            message = f"media upload failed for {absolute}: {exc}"
            logger.warning(message)
            self.errors.append(message)
            self.skipped += 1
            return None

        if isinstance(file_id, int):
            self._cache[file_id] = key
        self._url_cache[absolute] = key
        self.uploaded += 1
        return key

    def import_many(self, value: Any) -> list[str]:
        from flycatch_api.import_strapi.client import relation_list

        keys: list[str] = []
        for item in relation_list(value):
            key = self.import_file(item)
            if key:
                keys.append(key)
        return keys
