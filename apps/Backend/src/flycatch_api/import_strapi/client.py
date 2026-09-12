from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urljoin

import httpx

logger = logging.getLogger(__name__)

DEFAULT_PAGE_SIZE = 100


class StrapiClient:
    """Paginated Strapi v4 REST client."""

    def __init__(
        self,
        api_url: str,
        token: str,
        *,
        image_base_url: str | None = None,
        publication_state: str = "preview",
        timeout: float = 60.0,
    ) -> None:
        self.api_url = api_url.rstrip("/")
        self.image_base_url = (image_base_url or api_url.replace("/api", "")).rstrip("/")
        self.publication_state = publication_state
        self._client = httpx.Client(
            base_url=self.api_url + "/",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=timeout,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> StrapiClient:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    def absolute_url(self, path: str | None) -> str | None:
        if not path:
            return None
        if path.startswith("http://") or path.startswith("https://"):
            return path
        return urljoin(self.image_base_url + "/", path.lstrip("/"))

    def get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        response = self._client.get(path.lstrip("/"), params=params or {})
        response.raise_for_status()
        payload = response.json()
        # Some Flycatch Strapi collections return a bare list instead of {data, meta}.
        if isinstance(payload, list):
            return {
                "data": payload,
                "meta": {
                    "pagination": {
                        "page": 1,
                        "pageSize": len(payload),
                        "pageCount": 1,
                        "total": len(payload),
                    }
                },
            }
        if not isinstance(payload, dict):
            raise ValueError(f"Unexpected Strapi response for {path}")
        return payload

    def download_bytes(self, url: str) -> tuple[bytes, str | None]:
        """Fetch binary content from an absolute or relative media URL."""
        absolute = self.absolute_url(url) or url
        response = httpx.get(absolute, timeout=60.0, follow_redirects=True)
        response.raise_for_status()
        content_type = response.headers.get("content-type")
        return response.content, content_type

    def list_all(
        self,
        collection: str,
        *,
        populate: str | dict[str, Any] | None = "*",
        filters: dict[str, Any] | None = None,
        page_size: int = DEFAULT_PAGE_SIZE,
        sort: str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch every page of a collection and return unwrapped entities."""
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            params: dict[str, Any] = {
                "pagination[page]": page,
                "pagination[pageSize]": page_size,
                "publicationState": self.publication_state,
            }
            if populate is not None:
                if isinstance(populate, str):
                    params["populate"] = populate
                else:
                    params.update(_flatten_params("populate", populate))
            if filters:
                params.update(_flatten_params("filters", filters))
            if sort:
                params["sort"] = sort
            payload = self.get(collection, params)
            data = payload.get("data") or []
            if isinstance(data, dict):
                data = [data]
            for raw in data:
                items.append(unwrap_entity(raw))
            meta = (payload.get("meta") or {}).get("pagination") or {}
            page_count = int(meta.get("pageCount") or 1)
            logger.info(
                "Fetched %s page %s/%s (%s items so far)",
                collection,
                page,
                page_count,
                len(items),
            )
            if page >= page_count:
                break
            page += 1
        return items


def unwrap_entity(raw: Any) -> dict[str, Any]:
    """Normalize Strapi `{id, attributes}` or flat entity into a single dict with `id`."""
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        return {}
    if "attributes" in raw and isinstance(raw["attributes"], dict):
        out = dict(raw["attributes"])
        out["id"] = raw.get("id")
        return out
    return dict(raw)


def relation_list(value: Any) -> list[dict[str, Any]]:
    if value is None:
        return []
    if isinstance(value, list):
        return [unwrap_entity(item) for item in value if item is not None]
    if isinstance(value, dict):
        data = value.get("data", value)
        if data is None:
            return []
        if isinstance(data, list):
            return [unwrap_entity(item) for item in data if item is not None]
        return [unwrap_entity(data)]
    return []


def relation_one(value: Any) -> dict[str, Any] | None:
    items = relation_list(value)
    return items[0] if items else None


def media_file(value: Any) -> dict[str, Any] | None:
    """Return the first media file dict (with id + url + mime)."""
    return relation_one(value)


def _flatten_params(prefix: str, value: Any) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if isinstance(value, dict):
        for key, nested in value.items():
            out.update(_flatten_params(f"{prefix}[{key}]", nested))
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            out.update(_flatten_params(f"{prefix}[{index}]", nested))
    else:
        out[prefix] = value
    return out
