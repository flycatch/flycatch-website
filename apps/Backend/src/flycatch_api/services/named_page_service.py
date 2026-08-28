from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.admin_named_pages import (
    NamedPage,
    NamedPageList,
    NamedPageSummary,
    NamedPageWrite,
    PageName,
)
from flycatch_api.schemas.public_named_pages import (
    PublicNamedPage,
    PublicNamedPageList,
    PublicNamedPageSummary,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.content_blocks import accordion_dicts, optional_key, seo_dict
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.page_names import CLOUD_PAGE_NAMES
from flycatch_api.services.text import sanitize_html


class NamedPageService:
    def __init__(
        self,
        model: type[Any],
        admin_not_found: str,
        public_not_found: str,
        page_names: tuple[str, ...] = CLOUD_PAGE_NAMES,
    ) -> None:
        self.model = model
        self.admin_not_found = admin_not_found
        self.public_not_found = public_not_found
        self.page_names = page_names

    def list_entries(self, db: Session, q: str | None, page: int, per_page: int) -> NamedPageList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=False)
        return NamedPageList(
            items=[
                NamedPageSummary(
                    id=row.id,
                    page_name=row.page_name,
                    banner_title=row.banner_title,
                    banner_image_key=row.banner_image_key,
                    introduction_title=row.introduction_title,
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
    ) -> PublicNamedPageList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=True)
        return PublicNamedPageList(
            items=[
                PublicNamedPageSummary(
                    page_name=row.page_name,
                    banner_title=row.banner_title,
                    banner_image_key=row.banner_image_key,
                    introduction_title=row.introduction_title,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get_published_by_page_name(self, db: Session, page_name: str) -> PublicNamedPage:
        row = (
            db.query(self.model)
            .filter(
                self.model.page_name == page_name,
                self.model.status == ContentStatus.publish,
            )
            .first()
        )
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key=self.public_not_found).model_dump(),
            )
        return self._public(row)

    def get(self, db: Session, entry_id: UUID) -> NamedPage:
        return self._schema(self._row(db, entry_id))

    def create(self, db: Session, payload: NamedPageWrite) -> NamedPage:
        now = datetime.now(UTC)
        row = self.model(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return self._schema(row)

    def update(self, db: Session, entry_id: UUID, payload: NamedPageWrite) -> NamedPage:
        row = self._row(db, entry_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return self._schema(row)

    def delete(self, db: Session, entry_id: UUID) -> None:
        row = self._row(db, entry_id)
        db.delete(row)
        db.commit()

    def _schema(self, row: Any) -> NamedPage:
        return NamedPage(
            id=row.id,
            page_name=row.page_name,
            banner_title=row.banner_title,
            banner_image_key=row.banner_image_key,
            introduction_title=row.introduction_title,
            introduction_first_paragraph=row.introduction_first_paragraph,
            introduction_second_paragraph=row.introduction_second_paragraph,
            accordion=[AccordionItem.model_validate(item) for item in (row.accordion or [])],
            offering_image_key=row.offering_image_key,
            offering_title=row.offering_title,
            offering_description=row.offering_description,
            faq_title=row.faq_title,
            faq_description=row.faq_description,
            faq_accordion=[
                AccordionItem.model_validate(item) for item in (row.faq_accordion or [])
            ],
            seo=ContentSeo.model_validate(row.seo or {}),
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: Any) -> PublicNamedPage:
        schema = self._schema(row)
        return PublicNamedPage(
            page_name=schema.page_name,
            banner_title=schema.banner_title,
            banner_image_key=schema.banner_image_key,
            introduction_title=schema.introduction_title,
            introduction_first_paragraph=schema.introduction_first_paragraph,
            introduction_second_paragraph=schema.introduction_second_paragraph,
            accordion=schema.accordion,
            offering_image_key=schema.offering_image_key,
            offering_title=schema.offering_title,
            offering_description=schema.offering_description,
            faq_title=schema.faq_title,
            faq_description=schema.faq_description,
            faq_accordion=schema.faq_accordion,
            seo=schema.seo,
        )

    def _page(
        self,
        db: Session,
        q: str | None,
        page: int,
        per_page: int,
        *,
        published_only: bool,
    ) -> tuple[int, int, list[Any], int]:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(self.model)
        if published_only:
            query = query.filter(self.model.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    self.model.page_name.ilike(term),
                    self.model.banner_title.ilike(term),
                    self.model.introduction_title.ilike(term),
                )
            )
        total = query.count()
        rows = (
            query.order_by(self.model.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return page, per_page, rows, total

    def _row(self, db: Session, entry_id: UUID) -> Any:
        row = db.get(self.model, entry_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key=self.admin_not_found).model_dump(),
            )
        return row

    def _apply(
        self,
        db: Session,
        row: Any,
        payload: NamedPageWrite,
        entry_id: UUID | None,
    ) -> None:
        page_name: PageName = payload.page_name
        if page_name not in self.page_names:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"page_name": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        existing = db.query(self.model).filter(self.model.page_name == page_name).first()
        if existing is not None and existing.id != entry_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "page_name": FieldErrorDetail(
                            message_key="admin.named_pages.page_name.duplicate"
                        )
                    }
                ).model_dump(),
            )
        row.page_name = page_name
        row.banner_title = payload.banner_title.strip()
        row.banner_image_key = optional_key(payload.banner_image_key, "banner_image_key")
        row.introduction_title = payload.introduction_title.strip()
        row.introduction_first_paragraph = payload.introduction_first_paragraph.strip()
        row.introduction_second_paragraph = payload.introduction_second_paragraph.strip()
        row.accordion = accordion_dicts(payload.accordion, "accordion", html=True)
        row.offering_image_key = optional_key(payload.offering_image_key, "offering_image_key")
        row.offering_title = payload.offering_title.strip()
        row.offering_description = sanitize_html(payload.offering_description)
        row.faq_title = payload.faq_title.strip()
        row.faq_description = sanitize_html(payload.faq_description)
        row.faq_accordion = accordion_dicts(payload.faq_accordion, "faq_accordion", html=True)
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)
