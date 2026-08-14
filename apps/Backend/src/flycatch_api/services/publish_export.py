from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from flycatch_api.config import settings
from flycatch_api.models import ManagedRecord, RecordType
from flycatch_api.schemas import PageContent, PublishedSnapshot, SiteSettings
from flycatch_api.services.object_storage import ObjectStorageService


class PublishExportService:
    def __init__(self) -> None:
        self._storage = ObjectStorageService()

    def build_snapshot(self, db: Session) -> PublishedSnapshot:
        site_record = (
            db.query(ManagedRecord)
            .filter(
                ManagedRecord.type == RecordType.site_settings,
                ManagedRecord.slug == "default",
            )
            .first()
        )
        if not site_record or not site_record.published_payload:
            raise ValueError("Published site settings are required")

        pages = (
            db.query(ManagedRecord)
            .filter(
                ManagedRecord.type == RecordType.page,
                ManagedRecord.published_payload.isnot(None),
            )
            .all()
        )
        revision = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        snapshot = PublishedSnapshot(
            revision=revision,
            written_at=datetime.now(UTC),
            site_settings=SiteSettings.model_validate(site_record.published_payload),
            pages=[PageContent.model_validate(p.published_payload) for p in pages],
        )
        return snapshot

    def export_snapshot(self, db: Session) -> PublishedSnapshot:
        snapshot = self.build_snapshot(db)
        key = f"exports/{settings.environment}/published.json"
        self._storage.put_json(key, snapshot.model_dump(mode="json"))
        return snapshot
