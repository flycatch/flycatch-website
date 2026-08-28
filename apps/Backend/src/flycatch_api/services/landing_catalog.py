from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.public_landings import PublicLandingList, PublicLandingSummary
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.content_blocks import accordion_dicts, optional_key, seo_dict
from flycatch_api.services.home_service import DEFAULT_LOCALE, LOCALE_LABEL
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.text import is_valid_slug, sanitize_html, slugify


@dataclass(frozen=True)
class LandingFeatures:
    has_third_intro: bool = False
    has_accordion: bool = False
    has_experience: bool = False
    has_offering: bool = False
    has_faq: bool = False
    has_locale: bool = False
    list_kind: str = "intro_title"  # intro_title | intro_first | seo


def _items(value: list | None) -> list[AccordionItem]:
    return [AccordionItem.model_validate(item) for item in (value or [])]


def seo_snippet(seo: dict | None) -> str:
    data = seo or {}
    titles = (data.get("title") or "", data.get("description") or "")
    return " ".join(part for part in titles if part).strip()


class LandingCatalogService:
    def __init__(
        self,
        *,
        model: type[Any],
        detail_schema: type[Any],
        write_schema: type[Any],
        summary_schema: type[Any],
        list_schema: type[Any],
        public_schema: type[Any],
        resource: str,
        features: LandingFeatures,
    ) -> None:
        self.model = model
        self.detail_schema = detail_schema
        self.write_schema = write_schema
        self.summary_schema = summary_schema
        self.list_schema = list_schema
        self.public_schema = public_schema
        self.resource = resource
        self.features = features

    def list_entries(self, db: Session, q: str | None, page: int, per_page: int):
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=False)
        return self.list_schema(
            items=[self._summary(row) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> PublicLandingList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=True)
        return PublicLandingList(
            items=[
                PublicLandingSummary(
                    slug=row.slug,
                    banner_title=row.banner_title,
                    banner_image_key=row.banner_image_key,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get_published_by_slug(self, db: Session, slug: str):
        row = (
            db.query(self.model)
            .filter(
                func.lower(self.model.slug) == slug.strip().lower(),
                self.model.status == ContentStatus.publish,
            )
            .first()
        )
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key=f"public.{self.resource}.not_found").model_dump(),
            )
        return self._public(row)

    def get(self, db: Session, entry_id: UUID):
        return self._detail(self._row(db, entry_id))

    def create(self, db: Session, payload):
        now = datetime.now(UTC)
        row = self.model(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return self._detail(row)

    def update(self, db: Session, entry_id: UUID, payload):
        row = self._row(db, entry_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return self._detail(row)

    def delete(self, db: Session, entry_id: UUID) -> None:
        row = self._row(db, entry_id)
        db.delete(row)
        db.commit()

    def _unique_slug(self, db: Session, title: str, exclude_id: UUID | None) -> str:
        base = slugify(title) or "entry"
        if not is_valid_slug(base):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "banner_title": FieldErrorDetail(
                            message_key=f"admin.{self.resource}.slug.invalid"
                        )
                    }
                ).model_dump(),
            )
        slug = base
        suffix = 2
        while True:
            existing = (
                db.query(self.model)
                .filter(func.lower(self.model.slug) == slug.lower())
                .first()
            )
            if existing is None or existing.id == exclude_id:
                return slug
            slug = f"{base}-{suffix}"
            suffix += 1

    def _page(
        self,
        db: Session,
        q: str | None,
        page: int,
        per_page: int,
        *,
        published_only: bool,
    ):
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(self.model)
        if published_only:
            query = query.filter(self.model.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    self.model.banner_title.ilike(term),
                    self.model.introduction_title.ilike(term),
                    self.model.slug.ilike(term),
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

    def _row(self, db: Session, entry_id: UUID):
        row = db.get(self.model, entry_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key=f"admin.{self.resource}.not_found").model_dump(),
            )
        return row

    def _core_dict(self, row) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "id": row.id,
            "slug": row.slug,
            "banner_title": row.banner_title,
            "banner_image_key": row.banner_image_key,
            "introduction_title": row.introduction_title,
            "introduction_first_paragraph": row.introduction_first_paragraph,
            "introduction_second_paragraph": row.introduction_second_paragraph,
            "seo": ContentSeo.model_validate(row.seo or {}),
            "status": row.status,
            "created_at": row.created_at,
        }
        if self.features.has_third_intro:
            payload["introduction_third_paragraph"] = row.introduction_third_paragraph
        if self.features.has_accordion:
            payload["accordion"] = _items(row.accordion)
        if self.features.has_experience:
            payload["experience_title"] = row.experience_title
            payload["experience_accordion"] = _items(row.experience_accordion)
            payload["experience_image_key"] = row.experience_image_key
            payload["experience_description"] = row.experience_description
        if self.features.has_offering:
            payload["offering_image_key"] = row.offering_image_key
            payload["offering_title"] = row.offering_title
            payload["offering_description"] = row.offering_description
        if self.features.has_faq:
            payload["faq_title"] = row.faq_title
            payload["faq_description"] = row.faq_description
            payload["faq_accordion"] = _items(row.faq_accordion)
        if self.features.has_locale:
            payload["content_available_in"] = list(row.content_available_in or [DEFAULT_LOCALE])
        return payload

    def _detail(self, row):
        return self.detail_schema.model_validate(self._core_dict(row))

    def _public(self, row):
        data = self._core_dict(row)
        data.pop("id")
        data.pop("status")
        data.pop("created_at")
        return self.public_schema.model_validate(data)

    def _summary(self, row):
        base = {
            "id": row.id,
            "banner_title": row.banner_title,
            "banner_image_key": row.banner_image_key,
            "state": row.status,
        }
        if self.features.list_kind == "intro_first":
            base["introduction_first_paragraph"] = row.introduction_first_paragraph
            base["content_available_in"] = LOCALE_LABEL
        elif self.features.list_kind == "seo":
            base["seo"] = seo_snippet(row.seo)
        else:
            base["introduction_title"] = row.introduction_title
        return self.summary_schema.model_validate(base)

    def _apply(self, db: Session, row, payload, entry_id: UUID | None) -> None:
        row.slug = self._unique_slug(db, payload.banner_title, entry_id)
        row.banner_title = payload.banner_title.strip()
        row.banner_image_key = optional_key(payload.banner_image_key, "banner_image_key")
        row.introduction_title = payload.introduction_title.strip()
        row.introduction_first_paragraph = payload.introduction_first_paragraph.strip()
        row.introduction_second_paragraph = payload.introduction_second_paragraph.strip()
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)
        if self.features.has_third_intro:
            row.introduction_third_paragraph = payload.introduction_third_paragraph.strip()
        if self.features.has_accordion:
            row.accordion = accordion_dicts(payload.accordion, "accordion", html=True)
        if self.features.has_experience:
            row.experience_title = payload.experience_title.strip()
            row.experience_accordion = accordion_dicts(
                payload.experience_accordion, "experience_accordion", html=True
            )
            row.experience_image_key = optional_key(
                payload.experience_image_key, "experience_image_key"
            )
            row.experience_description = sanitize_html(payload.experience_description)
        if self.features.has_offering:
            row.offering_image_key = optional_key(payload.offering_image_key, "offering_image_key")
            row.offering_title = payload.offering_title.strip()
            row.offering_description = sanitize_html(payload.offering_description)
        if self.features.has_faq:
            row.faq_title = payload.faq_title.strip()
            row.faq_description = payload.faq_description.strip()
            row.faq_accordion = accordion_dicts(payload.faq_accordion, "faq_accordion", html=True)
        if self.features.has_locale:
            row.content_available_in = [DEFAULT_LOCALE]
