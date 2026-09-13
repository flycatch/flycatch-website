from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from flycatch_api.import_strapi.blocks_html import blocks_to_html, unknown_block_types
from flycatch_api.import_strapi.client import StrapiClient
from flycatch_api.import_strapi.media import MediaImporter
from flycatch_api.import_strapi.status import IdMap


@dataclass
class ImportStats:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)
    unhandled_blocks: dict[str, int] = field(default_factory=dict)

    def merge(self, other: ImportStats) -> None:
        self.created += other.created
        self.updated += other.updated
        self.skipped += other.skipped
        self.errors.extend(other.errors)
        for block_type, count in other.unhandled_blocks.items():
            self.unhandled_blocks[block_type] = self.unhandled_blocks.get(block_type, 0) + count

    @property
    def mapped(self) -> int:
        return self.created + self.updated

    def summary(self) -> str:
        unhandled = ",".join(
            f"{name}:{count}" for name, count in sorted(self.unhandled_blocks.items())
        )
        suffix = f" unhandled_blocks={unhandled}" if unhandled else ""
        return (
            f"created={self.created} updated={self.updated} "
            f"skipped={self.skipped} mapped={self.mapped} "
            f"errors={len(self.errors)}{suffix}"
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
        for block_type in unknown_block_types(value):
            self.stats.unhandled_blocks[block_type] = (
                self.stats.unhandled_blocks.get(block_type, 0) + 1
            )
            self.warnings.append(f"unhandled block type: {block_type}")
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
