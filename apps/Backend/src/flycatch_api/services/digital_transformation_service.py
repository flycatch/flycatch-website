from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.digital_transformation import DigitalTransformation
from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_digital_transformation import (
    DigitalTransformation as DigitalTransformationSchema,
)
from flycatch_api.schemas.admin_digital_transformation import (
    DigitalTransformationList,
    DigitalTransformationSummary,
    DigitalTransformationWrite,
)
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.public_digital_transformation import (
    PublicDigitalTransformation,
    PublicDigitalTransformationList,
    PublicDigitalTransformationSummary,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.content_blocks import accordion_dicts, optional_key, seo_dict
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.text import is_valid_slug, sanitize_html, slugify


def _unique_slug(db: Session, title: str, exclude_id: UUID | None) -> str:
    base = slugify(title) or "entry"
    if not is_valid_slug(base):
        raise CatalogError(
            422,
            FieldErrors(
                fields={
                    "banner_title": FieldErrorDetail(
                        message_key="admin.digital_transformation.slug.invalid"
                    )
                }
            ).model_dump(),
        )
    slug = base
    suffix = 2
    while True:
        existing = (
            db.query(DigitalTransformation)
            .filter(func.lower(DigitalTransformation.slug) == slug.lower())
            .first()
        )
        if existing is None or existing.id == exclude_id:
            return slug
        slug = f"{base}-{suffix}"
        suffix += 1


def dt_schema(row: DigitalTransformation) -> DigitalTransformationSchema:
    return DigitalTransformationSchema(
        id=row.id,
        slug=row.slug,
        banner_title=row.banner_title,
        banner_image_key=row.banner_image_key,
        banner_tag_line=row.banner_tag_line,
        introduction_title=row.introduction_title,
        introduction_first_paragraph=row.introduction_first_paragraph,
        introduction_second_paragraph=row.introduction_second_paragraph,
        accordion=[AccordionItem.model_validate(item) for item in (row.accordion or [])],
        outcomes_image_key=row.outcomes_image_key,
        outcomes_title=row.outcomes_title,
        outcomes_description=row.outcomes_description,
        faq_title=row.faq_title,
        faq_description=row.faq_description,
        faq_accordion=[AccordionItem.model_validate(item) for item in (row.faq_accordion or [])],
        seo=ContentSeo.model_validate(row.seo or {}),
        status=row.status,
        created_at=row.created_at,
    )


def public_dt(row: DigitalTransformation) -> PublicDigitalTransformation:
    schema = dt_schema(row)
    return PublicDigitalTransformation(
        slug=schema.slug,
        banner_title=schema.banner_title,
        banner_image_key=schema.banner_image_key,
        banner_tag_line=schema.banner_tag_line,
        introduction_title=schema.introduction_title,
        introduction_first_paragraph=schema.introduction_first_paragraph,
        introduction_second_paragraph=schema.introduction_second_paragraph,
        accordion=schema.accordion,
        outcomes_image_key=schema.outcomes_image_key,
        outcomes_title=schema.outcomes_title,
        outcomes_description=schema.outcomes_description,
        faq_title=schema.faq_title,
        faq_description=schema.faq_description,
        faq_accordion=schema.faq_accordion,
        seo=schema.seo,
    )


class DigitalTransformationService:
    def list_entries(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> DigitalTransformationList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=False)
        return DigitalTransformationList(
            items=[
                DigitalTransformationSummary(
                    id=row.id,
                    banner_title=row.banner_title,
                    banner_image_key=row.banner_image_key,
                    banner_tag_line=row.banner_tag_line,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> PublicDigitalTransformationList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=True)
        return PublicDigitalTransformationList(
            items=[
                PublicDigitalTransformationSummary(
                    slug=row.slug,
                    banner_title=row.banner_title,
                    banner_image_key=row.banner_image_key,
                    banner_tag_line=row.banner_tag_line,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get_published_by_slug(self, db: Session, slug: str) -> PublicDigitalTransformation:
        row = (
            db.query(DigitalTransformation)
            .filter(
                func.lower(DigitalTransformation.slug) == slug.strip().lower(),
                DigitalTransformation.status == ContentStatus.publish,
            )
            .first()
        )
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="public.digital_transformation.not_found").model_dump(),
            )
        return public_dt(row)

    def get(self, db: Session, entry_id: UUID) -> DigitalTransformationSchema:
        return dt_schema(self._row(db, entry_id))

    def create(
        self, db: Session, payload: DigitalTransformationWrite
    ) -> DigitalTransformationSchema:
        now = datetime.now(UTC)
        row = DigitalTransformation(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return dt_schema(row)

    def update(
        self, db: Session, entry_id: UUID, payload: DigitalTransformationWrite
    ) -> DigitalTransformationSchema:
        row = self._row(db, entry_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return dt_schema(row)

    def delete(self, db: Session, entry_id: UUID) -> None:
        row = self._row(db, entry_id)
        db.delete(row)
        db.commit()

    def _page(
        self,
        db: Session,
        q: str | None,
        page: int,
        per_page: int,
        *,
        published_only: bool,
    ) -> tuple[int, int, list[DigitalTransformation], int]:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(DigitalTransformation)
        if published_only:
            query = query.filter(DigitalTransformation.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    DigitalTransformation.banner_title.ilike(term),
                    DigitalTransformation.banner_tag_line.ilike(term),
                    DigitalTransformation.slug.ilike(term),
                )
            )
        total = query.count()
        rows = (
            query.order_by(DigitalTransformation.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return page, per_page, rows, total

    def _row(self, db: Session, entry_id: UUID) -> DigitalTransformation:
        row = db.get(DigitalTransformation, entry_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.digital_transformation.not_found").model_dump(),
            )
        return row

    def _apply(
        self,
        db: Session,
        row: DigitalTransformation,
        payload: DigitalTransformationWrite,
        entry_id: UUID | None,
    ) -> None:
        row.slug = _unique_slug(db, payload.banner_title, entry_id)
        row.banner_title = payload.banner_title.strip()
        row.banner_image_key = optional_key(payload.banner_image_key, "banner_image_key")
        row.banner_tag_line = payload.banner_tag_line.strip()
        row.introduction_title = payload.introduction_title.strip()
        row.introduction_first_paragraph = payload.introduction_first_paragraph.strip()
        row.introduction_second_paragraph = payload.introduction_second_paragraph.strip()
        row.accordion = accordion_dicts(payload.accordion, "accordion", html=True)
        row.outcomes_image_key = optional_key(payload.outcomes_image_key, "outcomes_image_key")
        row.outcomes_title = payload.outcomes_title.strip()
        row.outcomes_description = sanitize_html(payload.outcomes_description)
        row.faq_title = payload.faq_title.strip()
        row.faq_description = sanitize_html(payload.faq_description)
        row.faq_accordion = accordion_dicts(payload.faq_accordion, "faq_accordion", html=True)
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)
