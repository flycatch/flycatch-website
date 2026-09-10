from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from flycatch_api.import_strapi.blocks_html import blocks_to_html
from flycatch_api.import_strapi.client import StrapiClient
from flycatch_api.import_strapi.media import MediaImporter
from flycatch_api.import_strapi.status import IdMap


@dataclass
class ImportStats:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)

    def merge(self, other: ImportStats) -> None:
        self.created += other.created
        self.updated += other.updated
        self.skipped += other.skipped
        self.errors.extend(other.errors)

    def summary(self) -> str:
        return (
            f"created={self.created} updated={self.updated} "
            f"skipped={self.skipped} errors={len(self.errors)}"
        )


@dataclass
class ImportContext:
    db: Session
    client: StrapiClient
    media: MediaImporter
    id_map: IdMap = field(default_factory=IdMap)
    dry_run: bool = False
    warnings: list[str] = field(default_factory=list)
    stats: ImportStats = field(default_factory=ImportStats)

    def body_html(self, value: Any) -> str:
        return blocks_to_html(value, resolve_media=self._resolve_block_image)

    def _resolve_block_image(self, image: dict[str, Any]) -> str | None:
        # Blocks image nodes often embed url/id directly rather than data/attributes.
        if image.get("url") or image.get("id"):
            return self.media.import_file(image)
        return self.media.import_field(image)

    def record_error(self, collection: str, message: str) -> None:
        full = f"{collection}: {message}"
        self.stats.errors.append(full)
        self.warnings.append(full)
