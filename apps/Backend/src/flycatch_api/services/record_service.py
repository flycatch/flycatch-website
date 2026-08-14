from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from flycatch_api.models import ManagedRecord, RecordType
from flycatch_api.schemas import (
    Attribution,
    ManagedPage,
    ManagedSiteSettings,
    PageContent,
    PublishRejected,
    SiteSettings,
)


class RecordService:
    def get_site_settings(self, db: Session) -> ManagedRecord:
        record = self._get_record(db, RecordType.site_settings, "default")
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return record

    def get_page(self, db: Session, slug: str) -> ManagedRecord:
        record = self._get_record(db, RecordType.page, slug)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return record

    def save_site_settings_draft(
        self, db: Session, payload: SiteSettings, admin_id: UUID
    ) -> ManagedSiteSettings:
        record = self.get_site_settings(db)
        record.draft_payload = payload.model_dump(mode="json")
        record.draft_updated_at = datetime.now(UTC)
        record.draft_updated_by = admin_id
        db.commit()
        return self._to_managed_site_settings(record)

    def save_page_draft(
        self, db: Session, slug: str, payload: PageContent, admin_id: UUID
    ) -> ManagedPage:
        record = self.get_page(db, slug)
        record.draft_payload = payload.model_dump(mode="json")
        record.draft_updated_at = datetime.now(UTC)
        record.draft_updated_by = admin_id
        db.commit()
        return self._to_managed_page(record)

    def publish_record(
        self, db: Session, record_type: RecordType, slug: str, admin_id: UUID
    ) -> ManagedRecord:
        record = self._get_record(db, record_type, slug)
        if not record or not record.draft_payload:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        validation_error = self._validate_for_publish(db, record)
        if validation_error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=validation_error.model_dump(),
            )

        record.published_payload = record.draft_payload
        record.published_at = datetime.now(UTC)
        record.published_by = admin_id
        db.commit()
        return record

    def _validate_for_publish(self, db: Session, record: ManagedRecord) -> PublishRejected | None:
        if record.type == RecordType.page:
            page = PageContent.model_validate(record.draft_payload)
            if page.seo.indexable:
                if not page.seo.title or not page.seo.description or not page.seo.primary_heading:
                    return PublishRejected(
                        message_key="admin.field.required",
                        fields={"seo": {"message_key": "admin.field.required"}},
                    )
                duplicates = (
                    db.query(ManagedRecord)
                    .filter(
                        ManagedRecord.type == RecordType.page,
                        ManagedRecord.slug != record.slug,
                        ManagedRecord.published_payload.isnot(None),
                    )
                    .all()
                )
                for other in duplicates:
                    other_page = PageContent.model_validate(other.published_payload)
                    if other_page.seo.indexable and other_page.seo.title == page.seo.title:
                        return PublishRejected(
                            message_key="admin.field.required",
                            fields={"seo.title": {"message_key": "admin.field.required"}},
                        )
        return None

    def _get_record(
        self, db: Session, record_type: RecordType, slug: str
    ) -> ManagedRecord | None:
        return (
            db.query(ManagedRecord)
            .filter(ManagedRecord.type == record_type, ManagedRecord.slug == slug)
            .first()
        )

    def _to_managed_site_settings(self, record: ManagedRecord) -> ManagedSiteSettings:
        return ManagedSiteSettings(
            draft=SiteSettings.model_validate(record.draft_payload),
            published=(
                SiteSettings.model_validate(record.published_payload)
                if record.published_payload
                else None
            ),
            draft_updated=Attribution(at=record.draft_updated_at, by=record.draft_updated_by),
            published_meta=(
                Attribution(at=record.published_at, by=record.published_by)
                if record.published_at and record.published_by
                else None
            ),
        )

    def _to_managed_page(self, record: ManagedRecord) -> ManagedPage:
        return ManagedPage(
            slug=record.slug,
            draft=PageContent.model_validate(record.draft_payload),
            published=(
                PageContent.model_validate(record.published_payload)
                if record.published_payload
                else None
            ),
            draft_updated=Attribution(at=record.draft_updated_at, by=record.draft_updated_by),
            published_meta=(
                Attribution(at=record.published_at, by=record.published_by)
                if record.published_at and record.published_by
                else None
            ),
        )
