from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

from flycatch_api.models.blog import BlogStatus
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.services.text import sanitize_html, slugify


def content_status(attrs: dict[str, Any]) -> ContentStatus:
    if "publishedAt" in attrs or "published_at" in attrs:
        if attrs.get("publishedAt") or attrs.get("published_at"):
            return ContentStatus.publish
        return ContentStatus.draft
    status = attrs.get("status")
    if status in (1, "1", "publish", "published", True):
        return ContentStatus.publish
    if status in (0, "0", "draft", False):
        return ContentStatus.draft
    # Custom Strapi responses (e.g. flattened homepages) omit publication fields entirely.
    if "status" not in attrs and "publishedAt" not in attrs and "published_at" not in attrs:
        return ContentStatus.publish
    return ContentStatus.draft


def blog_status(attrs: dict[str, Any]) -> BlogStatus:
    return (
        BlogStatus.publish if content_status(attrs) == ContentStatus.publish else BlogStatus.draft
    )


def parse_datetime(value: Any, fallback: datetime | None = None) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, str) and value.strip():
        text = value.strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(text)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
        except ValueError:
            pass
    return fallback or datetime.now(UTC)


def parse_date(value: Any) -> date | None:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str) and value.strip():
        text = value.strip()[:10]
        try:
            return date.fromisoformat(text)
        except ValueError:
            return None
    return None


def truncate(
    value: Any, limit: int, *, field: str | None = None, warnings: list[str] | None = None
) -> str:
    text = "" if value is None else str(value)
    if len(text) <= limit:
        return text
    if warnings is not None and field:
        warnings.append(f"truncated {field} from {len(text)} to {limit}")
    return text[:limit]


def as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        # Likely Strapi blocks — caller should convert; fall back to empty.
        return ""
    return str(value)


def as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def as_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return default


class SlugCollisionError(ValueError):
    """Two source entries would write the same target slug."""


def ensure_slug(value: Any, fallback: str, *, warnings: list[str] | None = None) -> str:
    raw = as_text(value).strip()
    if raw:
        # Preserve the source slug exactly, including mixed case.
        return truncate(raw, 255)
    generated = slugify(as_text(fallback)) or "item"
    if warnings is not None:
        warnings.append(f"generated slug {generated!r} from fallback {fallback!r}")
    return truncate(generated, 255)


def map_seo(
    value: Any,
    *,
    image_key: str | None = None,
    fallback: dict[str, Any] | None = None,
) -> dict[str, Any]:
    seo = value if isinstance(value, dict) else {}
    # Component may be wrapped
    if "data" in seo and isinstance(seo.get("data"), dict):
        seo = unwrap_attrs(seo["data"])
    extra = fallback or {}
    title = seo.get("title") or seo.get("meta_title") or extra.get("title") or ""
    description = seo.get("description") or extra.get("description") or ""
    canonical = seo.get("canonical_url") or extra.get("canonical_url") or ""
    image_alt = seo.get("image_alt") or extra.get("image_alt") or ""
    return {
        "title": truncate(title, 200),
        "description": truncate(description, 500),
        "canonical_url": truncate(canonical, 500),
        "meta_title": truncate(seo.get("meta_title") or title, 200),
        "h1_tag": truncate(seo.get("h1_tag") or extra.get("h1_tag") or "", 200),
        "image_alt": truncate(image_alt, 200),
        "image_key": image_key or extra.get("image_key"),
    }


def editorial_author_name(entity: dict[str, Any], author: dict[str, Any] | None) -> str:
    """Public byline only — never staff account fields such as email."""
    name = as_text(entity.get("full_name") or entity.get("author_name"))
    if name:
        return name
    if not author:
        return ""
    return as_text(author.get("username") or author.get("name"))


def unwrap_attrs(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        return {}
    if "attributes" in raw and isinstance(raw["attributes"], dict):
        out = dict(raw["attributes"])
        out["id"] = raw.get("id")
        return out
    return dict(raw)


def html_or_empty(value: str) -> str:
    return sanitize_html(value or "")


class IdMap:
    """Maps Strapi collection:id → local UUID."""

    def __init__(self) -> None:
        self._data: dict[str, dict[int, UUID]] = {}

    def set(self, collection: str, strapi_id: int | None, local_id: UUID) -> None:
        if strapi_id is None:
            return
        self._data.setdefault(collection, {})[int(strapi_id)] = local_id

    def get(self, collection: str, strapi_id: int | None) -> UUID | None:
        if strapi_id is None:
            return None
        return self._data.get(collection, {}).get(int(strapi_id))

    def owner(self, collection: str, local_id: UUID) -> int | None:
        for strapi_id, mapped in self._data.get(collection, {}).items():
            if mapped == local_id:
                return strapi_id
        return None

    def to_dict(self) -> dict[str, dict[str, str]]:
        return {
            collection: {str(k): str(v) for k, v in mapping.items()}
            for collection, mapping in self._data.items()
        }

    def load_dict(self, payload: dict[str, Any]) -> None:
        for collection, mapping in payload.items():
            if not isinstance(mapping, dict):
                continue
            for key, value in mapping.items():
                try:
                    self.set(collection, int(key), UUID(str(value)))
                except (TypeError, ValueError):
                    continue
