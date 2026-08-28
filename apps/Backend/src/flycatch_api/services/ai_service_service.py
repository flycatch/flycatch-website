from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from flycatch_api.models.ai_service import AiService, AiServiceSolution
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.solution_detail import SolutionDetail
from flycatch_api.schemas.admin_ai_services import (
    AccordionItem,
    AiServiceList,
    AiServiceSummary,
    AiServiceWrite,
    IndustryItem,
)
from flycatch_api.schemas.admin_ai_services import AiService as AiServiceSchema
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.public_ai_services import (
    PublicAiService,
    PublicAiServiceList,
    PublicAiServiceSummary,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.content_blocks import accordion_dicts, optional_key, seo_dict
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.solution_detail_service import public_detail
from flycatch_api.services.text import is_valid_slug, sanitize_html, slugify


def _industry_items(items: list[IndustryItem]) -> list[dict]:
    result: list[dict] = []
    for index, item in enumerate(items):
        result.append(
            {
                "title": item.title.strip(),
                "image_key": optional_key(item.image_key, f"industry_items.{index}.image_key"),
                "order": item.order,
            }
        )
    return result


def _unique_slug(db: Session, title: str, exclude_id: UUID | None) -> str:
    base = slugify(title) or "entry"
    if not is_valid_slug(base):
        raise CatalogError(
            422,
            FieldErrors(
                fields={
                    "banner_title": FieldErrorDetail(message_key="admin.ai_services.slug.invalid")
                }
            ).model_dump(),
        )
    slug = base
    suffix = 2
    while True:
        existing = db.query(AiService).filter(func.lower(AiService.slug) == slug.lower()).first()
        if existing is None or existing.id == exclude_id:
            return slug
        slug = f"{base}-{suffix}"
        suffix += 1


def ai_schema(row: AiService) -> AiServiceSchema:
    return AiServiceSchema(
        id=row.id,
        slug=row.slug,
        banner_title=row.banner_title,
        banner_image_key=row.banner_image_key,
        introduction_title=row.introduction_title,
        introduction_description=row.introduction_description,
        solutions_title=row.solutions_title,
        solutions_description=row.solutions_description,
        industry_title=row.industry_title,
        industry_description=row.industry_description,
        industry_items=[IndustryItem.model_validate(item) for item in (row.industry_items or [])],
        ai_expertise_title=row.ai_expertise_title,
        ai_expertise_image_key=row.ai_expertise_image_key,
        ai_expertise_accordion=[
            AccordionItem.model_validate(item) for item in (row.ai_expertise_accordion or [])
        ],
        ai_expertise_accordion_description=row.ai_expertise_accordion_description,
        solution_ids=[link.solution_detail_id for link in row.solution_links],
        faq_title=row.faq_title,
        faq_description=row.faq_description,
        faq_accordion=[
            AccordionItem.model_validate(item) for item in (row.faq_accordion or [])
        ],
        seo=ContentSeo.model_validate(row.seo or {}),
        status=row.status,
        created_at=row.created_at,
    )


def public_ai(row: AiService) -> PublicAiService:
    schema = ai_schema(row)
    solutions = [
        public_detail(link.solution_detail)
        for link in row.solution_links
        if link.solution_detail is not None and link.solution_detail.status == ContentStatus.publish
    ]
    return PublicAiService(
        slug=schema.slug,
        banner_title=schema.banner_title,
        banner_image_key=schema.banner_image_key,
        introduction_title=schema.introduction_title,
        introduction_description=schema.introduction_description,
        solutions_title=schema.solutions_title,
        solutions_description=schema.solutions_description,
        industry_title=schema.industry_title,
        industry_description=schema.industry_description,
        industry_items=schema.industry_items,
        ai_expertise_title=schema.ai_expertise_title,
        ai_expertise_image_key=schema.ai_expertise_image_key,
        ai_expertise_accordion=schema.ai_expertise_accordion,
        ai_expertise_accordion_description=schema.ai_expertise_accordion_description,
        solutions=solutions,
        faq_title=schema.faq_title,
        faq_description=schema.faq_description,
        faq_accordion=schema.faq_accordion,
        seo=schema.seo,
    )


class AiServiceService:
    def list_entries(self, db: Session, q: str | None, page: int, per_page: int) -> AiServiceList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=False)
        return AiServiceList(
            items=[
                AiServiceSummary(
                    id=row.id,
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
    ) -> PublicAiServiceList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=True)
        return PublicAiServiceList(
            items=[
                PublicAiServiceSummary(
                    slug=row.slug,
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

    def get_published_by_slug(self, db: Session, slug: str) -> PublicAiService:
        row = (
            db.query(AiService)
            .filter(
                func.lower(AiService.slug) == slug.strip().lower(),
                AiService.status == ContentStatus.publish,
            )
            .first()
        )
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="public.ai_services.not_found").model_dump(),
            )
        return public_ai(row)

    def get(self, db: Session, entry_id: UUID) -> AiServiceSchema:
        return ai_schema(self._row(db, entry_id))

    def create(self, db: Session, payload: AiServiceWrite) -> AiServiceSchema:
        now = datetime.now(UTC)
        row = AiService(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return ai_schema(row)

    def update(self, db: Session, entry_id: UUID, payload: AiServiceWrite) -> AiServiceSchema:
        row = self._row(db, entry_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return ai_schema(row)

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
    ) -> tuple[int, int, list[AiService], int]:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(AiService)
        if published_only:
            query = query.filter(AiService.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    AiService.banner_title.ilike(term),
                    AiService.introduction_title.ilike(term),
                    AiService.slug.ilike(term),
                )
            )
        total = query.count()
        rows = (
            query.order_by(AiService.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return page, per_page, rows, total

    def _row(self, db: Session, entry_id: UUID) -> AiService:
        row = db.get(AiService, entry_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.ai_services.not_found").model_dump(),
            )
        return row

    def _solution_details(self, db: Session, ids: list[UUID]) -> list[SolutionDetail]:
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(SolutionDetail).filter(SolutionDetail.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "solution_ids": FieldErrorDetail(
                            message_key="admin.ai_services.solutions.invalid"
                        )
                    }
                ).model_dump(),
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _apply(
        self,
        db: Session,
        row: AiService,
        payload: AiServiceWrite,
        entry_id: UUID | None,
    ) -> None:
        row.slug = _unique_slug(db, payload.banner_title, entry_id)
        row.banner_title = payload.banner_title.strip()
        row.banner_image_key = optional_key(payload.banner_image_key, "banner_image_key")
        row.introduction_title = payload.introduction_title.strip()
        row.introduction_description = payload.introduction_description.strip()
        row.solutions_title = payload.solutions_title.strip()
        row.solutions_description = payload.solutions_description.strip()
        row.industry_title = payload.industry_title.strip()
        row.industry_description = payload.industry_description.strip()
        row.industry_items = _industry_items(payload.industry_items)
        row.ai_expertise_title = payload.ai_expertise_title.strip()
        row.ai_expertise_image_key = optional_key(
            payload.ai_expertise_image_key, "ai_expertise_image_key"
        )
        row.ai_expertise_accordion = accordion_dicts(
            payload.ai_expertise_accordion, "ai_expertise_accordion", html=True
        )
        row.ai_expertise_accordion_description = sanitize_html(
            payload.ai_expertise_accordion_description
        )
        row.faq_title = payload.faq_title.strip()
        row.faq_description = sanitize_html(payload.faq_description)
        row.faq_accordion = accordion_dicts(payload.faq_accordion, "faq_accordion", html=True)
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)
        details = self._solution_details(db, payload.solution_ids)
        row.solution_links = [
            AiServiceSolution(solution_detail=item, position=index)
            for index, item in enumerate(details)
        ]
