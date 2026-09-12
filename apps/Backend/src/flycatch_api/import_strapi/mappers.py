from __future__ import annotations

from typing import Any

from flycatch_api.import_strapi.blocks_html import blocks_to_html
from flycatch_api.import_strapi.client import relation_list
from flycatch_api.import_strapi.context import ImportContext
from flycatch_api.import_strapi.status import as_int, as_text, truncate
from flycatch_api.services.text import sanitize_html


def map_accordion(
    ctx: ImportContext, value: Any, *, title_keys: tuple[str, ...] = ()
) -> list[dict]:
    """Normalize Strapi accordion components into `{title, contents, order}`."""
    items = relation_list(value) if isinstance(value, dict) and "data" in value else None
    if items is None:
        if isinstance(value, list):
            items = [item if isinstance(item, dict) else {} for item in value]
        elif value is None:
            items = []
        else:
            items = [value] if isinstance(value, dict) else []

    default_title_keys = title_keys or (
        "title",
        "ai_expertise_accordian_title",
        "accordion_title",
        "name",
        "heading",
    )
    content_keys = (
        "contents",
        "ai_expertise_accordian_contents",
        "accordion_contents",
        "content",
        "description",
        "body",
    )
    result: list[dict] = []
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        title = ""
        for key in default_title_keys:
            if item.get(key) is not None and not isinstance(item.get(key), (dict, list)):
                title = as_text(item.get(key))
                break
            # Sometimes title is a media-ish relation; skip
        contents_raw: Any = ""
        for key in content_keys:
            if key in item and item[key] is not None:
                contents_raw = item[key]
                break
        if isinstance(contents_raw, list):
            contents = ctx.body_html(contents_raw)
        else:
            contents = sanitize_html(as_text(contents_raw))
        result.append(
            {
                "title": truncate(title, 200),
                "contents": contents,
                "order": as_int(item.get("order"), index),
            }
        )
    return result


def map_home_services(ctx: ImportContext, value: Any) -> list[dict]:
    items = relation_list(value) if isinstance(value, dict) else None
    if items is None:
        items = value if isinstance(value, list) else []
    result: list[dict] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        image_key = ctx.media.import_field(
            item.get("services_image") or item.get("image") or item.get("services_images")
        )
        contents_raw = (
            item.get("services_contents") or item.get("contents") or item.get("description")
        )
        if isinstance(contents_raw, list):
            contents = ctx.body_html(contents_raw)
        else:
            contents = sanitize_html(as_text(contents_raw))
        result.append(
            {
                "services_types_title": truncate(
                    item.get("services_types_title") or item.get("title") or "", 200
                ),
                "services_image_key": image_key,
                "services_contents": contents,
                "our_services_links": as_text(
                    item.get("our_services_links") or item.get("link") or ""
                ),
            }
        )
    return result


def map_home_faqs(value: Any) -> list[dict]:
    items = relation_list(value) if isinstance(value, dict) else None
    if items is None:
        items = value if isinstance(value, list) else []
    result: list[dict] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        contents = item.get("contents") or item.get("description") or item.get("answer") or ""
        if isinstance(contents, list):
            contents = blocks_to_html(contents)
        result.append(
            {
                "title": truncate(item.get("title") or item.get("question") or "", 200),
                "contents": sanitize_html(as_text(contents)),
            }
        )
    return result


def rewrite_media_in_json(ctx: ImportContext, value: Any) -> Any:
    """Recursively replace Strapi media objects with media keys in nested JSON."""
    if isinstance(value, list):
        return [rewrite_media_in_json(ctx, item) for item in value]
    if not isinstance(value, dict):
        return value

    # Detect media-shaped dict
    if "url" in value and (
        "mime" in value or "ext" in value or "formats" in value or "hash" in value
    ):
        key = ctx.media.import_file(value)
        return key

    if "data" in value and (
        isinstance(value.get("data"), dict)
        or isinstance(value.get("data"), list)
        or value.get("data") is None
    ):
        # relation / media wrapper
        media_key = ctx.media.import_field(value)
        if media_key is not None or value.get("data") is None:
            # If it looked like media (had url after unwrap) prefer key; else recurse data
            from flycatch_api.import_strapi.client import media_file

            if media_file(value) is not None or value.get("data") is None:
                return media_key
        data = value.get("data")
        if isinstance(data, list):
            return [rewrite_media_in_json(ctx, item) for item in data]
        if isinstance(data, dict):
            return rewrite_media_in_json(ctx, data)
        return None

    out: dict[str, Any] = {}
    for key, nested in value.items():
        if key in {"image", "icon", "logo", "banner_image", "icons"} and nested is not None:
            media_key = ctx.media.import_field(nested)
            if media_key is not None or (isinstance(nested, dict) and nested.get("data") is None):
                # Prefer storing as `{key}_key` when the field name is `image`
                if key == "image":
                    out["image_key"] = media_key
                    continue
                if key.endswith("_image") or key in {"icon", "logo"}:
                    out[f"{key}_key" if not key.endswith("_key") else key] = media_key
                    continue
        out[key] = rewrite_media_in_json(ctx, nested)
    return out


def first_attr(entity: dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key in entity and entity[key] is not None:
            return entity[key]
    return default
