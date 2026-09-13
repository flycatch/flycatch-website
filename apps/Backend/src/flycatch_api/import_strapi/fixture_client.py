from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from flycatch_api.import_strapi.client import unwrap_entity

COLLECTION_FILES = {
    "blogs": "blogs.json",
    "categories": "categories.json",
    "case-studies": "case_studies.json",
    "downloads": "downloads.json",
    "client-testimonials": "client_testimonials.json",
    "employee-testimonials": "employee_testimonials.json",
    "openings": "openings.json",
    "ai-services": "ai_services.json",
    "solution-details": "solution_details.json",
    "products": "products.json",
    "application-development-services": "application_development.json",
    "flycatch-saudi-arabias": "saudi.json",
}

PNG_BYTES = b"\x89PNG\r\n\x1a\nfake"
PDF_BYTES = b"%PDF-1.4 fixture\n"


class FixtureStrapiClient:
    """Read checked-in Strapi fixture JSON instead of a live CMS."""

    def __init__(self, directory: Path) -> None:
        self.directory = directory
        self.image_base_url = "http://fixtures.local"
        self.publication_state = "live"

    def close(self) -> None:
        return None

    def __enter__(self) -> FixtureStrapiClient:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    def absolute_url(self, path: str | None) -> str | None:
        if not path:
            return None
        if path.startswith("http://") or path.startswith("https://"):
            return path
        return f"{self.image_base_url}/{path.lstrip('/')}"

    def list_all(
        self,
        collection: str,
        *,
        populate: str | dict[str, Any] | None = "*",
        filters: dict[str, Any] | None = None,
        page_size: int = 100,
        sort: str | None = None,
    ) -> list[dict[str, Any]]:
        name = COLLECTION_FILES.get(collection, f"{collection.replace('-', '_')}.json")
        path = self.directory / name
        if not path.exists():
            return []
        payload = json.loads(path.read_text())
        if isinstance(payload, list):
            rows = payload
        elif isinstance(payload, dict):
            data = payload.get("data", payload)
            rows = data if isinstance(data, list) else [data]
        else:
            rows = []
        return [unwrap_entity(row) for row in rows if row is not None]

    def download_bytes(self, url: str) -> tuple[bytes, str | None]:
        lowered = (url or "").lower()
        if lowered.endswith(".pdf"):
            return PDF_BYTES, "application/pdf"
        return PNG_BYTES, "image/png"
