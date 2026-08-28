from __future__ import annotations

from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.text import is_valid_media_key, sanitize_html


def optional_key(value: str | None, field: str) -> str | None:
    key = value or None
    if key and not is_valid_media_key(key):
        raise CatalogError(
            422,
            FieldErrors(
                fields={field: FieldErrorDetail(message_key="admin.media.type.invalid")}
            ).model_dump(),
        )
    return key


def seo_dict(payload: ContentSeo) -> dict:
    return {
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "canonical_url": payload.canonical_url.strip(),
        "meta_title": payload.meta_title.strip(),
        "h1_tag": payload.h1_tag.strip(),
        "image_alt": payload.image_alt.strip(),
        "image_key": optional_key(payload.image_key, "seo.image_key"),
    }


def accordion_dicts(items: list, prefix: str, *, html: bool) -> list[dict]:
    result: list[dict] = []
    for index, item in enumerate(items):
        contents = sanitize_html(item.contents) if html else item.contents.strip()
        result.append(
            {
                "title": item.title.strip(),
                "contents": contents,
                "order": item.order,
            }
        )
        _ = prefix, index
    return result
