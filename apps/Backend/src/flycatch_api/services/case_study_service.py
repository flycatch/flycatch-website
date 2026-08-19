from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from flycatch_api.models import (
    CaseStudy,
    CaseStudyCategory,
    CaseStudyCategoryLink,
    CaseStudyIndustry,
    Industry,
)
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import (
    CaseStudyDetail,
    CaseStudyList,
    CaseStudySummary,
    CaseStudyWrite,
    EntityNotFound,
)
from flycatch_api.schemas.public_case_studies import (
    PublicCaseStudyDetail,
    PublicCaseStudyList,
    PublicCaseStudySummary,
    PublicNamedItem,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.case_study_category_service import category_schema
from flycatch_api.services.industry_service import PER_PAGE, coerce_status, industry_schema
from flycatch_api.services.text import is_valid_slug, sanitize_html, slugify

DEFAULT_LOCALE = "en"
LOCALE_LABEL = "En"


class CaseStudyService:
    def list_case_studies(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> CaseStudyList:
        page, per_page, rows, total = self._paginated(db, q, page, per_page, published_only=False)
        return CaseStudyList(
            items=[self._summary(row) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> PublicCaseStudyList:
        page, per_page, rows, total = self._paginated(db, q, page, per_page, published_only=True)
        return PublicCaseStudyList(
            items=[self._public_summary(row) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get_published_by_slug(self, db: Session, slug: str) -> PublicCaseStudyDetail:
        row = (
            db.query(CaseStudy)
            .options(*self._options())
            .filter(
                func.lower(CaseStudy.slug) == slug.strip().lower(),
                CaseStudy.status == ContentStatus.publish,
            )
            .first()
        )
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="public.case_studies.not_found").model_dump(),
            )
        return self._public_detail(row)

    def get(self, db: Session, case_study_id: UUID) -> CaseStudyDetail:
        return self._detail(db, self._load(db, case_study_id))

    def create(self, db: Session, payload: CaseStudyWrite) -> CaseStudyDetail:
        now = datetime.now(UTC)
        row = CaseStudy(
            created_at=now,
            updated_at=now,
            content_available_in=[DEFAULT_LOCALE],
        )
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return self.get(db, row.id)

    def update(self, db: Session, case_study_id: UUID, payload: CaseStudyWrite) -> CaseStudyDetail:
        row = self._load(db, case_study_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return self.get(db, row.id)

    def delete(self, db: Session, case_study_id: UUID) -> None:
        row = self._load(db, case_study_id)
        db.delete(row)
        db.commit()

    def _options(self):
        return (
            joinedload(CaseStudy.industry_links).joinedload(CaseStudyIndustry.industry),
            joinedload(CaseStudy.category_links).joinedload(CaseStudyCategoryLink.category),
        )

    def _paginated(
        self,
        db: Session,
        q: str | None,
        page: int,
        per_page: int,
        *,
        published_only: bool,
    ) -> tuple[int, int, list[CaseStudy], int]:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(CaseStudy)
        if published_only:
            query = query.filter(CaseStudy.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            matching = (
                db.query(CaseStudy.id)
                .outerjoin(CaseStudyIndustry, CaseStudyIndustry.case_study_id == CaseStudy.id)
                .outerjoin(Industry, Industry.id == CaseStudyIndustry.industry_id)
                .filter(
                    or_(
                        CaseStudy.heading.ilike(term),
                        CaseStudy.slug.ilike(term),
                        CaseStudy.short_heading.ilike(term),
                        Industry.name.ilike(term),
                    )
                )
                .distinct()
            )
            query = query.filter(CaseStudy.id.in_(matching))
        total = query.count()
        order_clauses = (
            (CaseStudy.sort_order.asc(), CaseStudy.occurred_on.desc(), CaseStudy.created_at.desc())
            if published_only
            else (CaseStudy.created_at.desc(),)
        )
        rows = (
            query.options(*self._options())
            .order_by(*order_clauses)
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return page, per_page, rows, total

    def _load(self, db: Session, case_study_id: UUID) -> CaseStudy:
        row = (
            db.query(CaseStudy)
            .options(*self._options())
            .filter(CaseStudy.id == case_study_id)
            .first()
        )
        if row is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.case_studies.not_found").model_dump()
            )
        return row

    def _apply(
        self, db: Session, row: CaseStudy, payload: CaseStudyWrite, case_study_id: UUID | None
    ) -> None:
        heading = payload.heading.strip()
        if not heading:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"heading": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        slug = slugify(payload.slug) or slugify(heading)
        if not is_valid_slug(slug):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "slug": FieldErrorDetail(message_key="admin.case_studies.slug.invalid")
                    }
                ).model_dump(),
            )
        existing = (
            db.query(CaseStudy).filter(func.lower(CaseStudy.slug) == slug.lower()).first()
        )
        if existing is not None and existing.id != case_study_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "slug": FieldErrorDetail(message_key="admin.case_studies.slug.duplicate")
                    }
                ).model_dump(),
            )
        industries = self._industries(db, payload.industry_ids)
        categories = self._categories(db, payload.category_ids)
        row.heading = heading
        row.slug = slug
        row.short_heading = payload.short_heading.strip()
        row.description = payload.description.strip()
        row.body = sanitize_html(payload.body)
        row.sort_order = payload.order
        row.occurred_on = payload.date
        row.status = coerce_status(payload.status)
        row.image_key = payload.image_key or None
        row.image_alt = payload.image_alt.strip()
        row.content_available_in = [DEFAULT_LOCALE]
        row.industry_links = [CaseStudyIndustry(industry=item) for item in industries]
        row.category_links = [CaseStudyCategoryLink(category=item) for item in categories]

    def _industries(self, db: Session, ids: list[UUID]) -> list[Industry]:
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(Industry).filter(Industry.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "industry_ids": FieldErrorDetail(
                            message_key="admin.case_studies.industries.invalid"
                        )
                    }
                ).model_dump(),
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _categories(self, db: Session, ids: list[UUID]) -> list[CaseStudyCategory]:
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(CaseStudyCategory).filter(CaseStudyCategory.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "category_ids": FieldErrorDetail(
                            message_key="admin.case_studies.categories.invalid"
                        )
                    }
                ).model_dump(),
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _summary(self, row: CaseStudy) -> CaseStudySummary:
        names = [link.industry.name for link in row.industry_links if link.industry]
        return CaseStudySummary(
            id=row.id,
            heading=row.heading,
            industry=", ".join(names),
            order=row.sort_order,
            short_heading=row.short_heading,
            content_available_in=LOCALE_LABEL,
            state=row.status,
        )

    def _detail(self, db: Session, row: CaseStudy) -> CaseStudyDetail:
        industries = [industry_schema(link.industry) for link in row.industry_links]
        categories = [category_schema(db, link.category) for link in row.category_links]
        return CaseStudyDetail(
            id=row.id,
            heading=row.heading,
            slug=row.slug,
            short_heading=row.short_heading,
            description=row.description,
            body=row.body,
            order=row.sort_order,
            date=row.occurred_on,
            status=row.status,
            image_key=row.image_key,
            image_alt=row.image_alt,
            content_available_in=list(row.content_available_in or [DEFAULT_LOCALE]),
            industry_ids=[item.id for item in industries],
            category_ids=[item.id for item in categories],
            industries=industries,
            categories=categories,
        )

    def _public_industries(self, row: CaseStudy) -> list[PublicNamedItem]:
        return [
            PublicNamedItem(name=link.industry.name)
            for link in row.industry_links
            if link.industry and link.industry.status == ContentStatus.publish
        ]

    def _public_categories(self, row: CaseStudy) -> list[PublicNamedItem]:
        return [
            PublicNamedItem(name=link.category.name)
            for link in row.category_links
            if link.category and link.category.status == ContentStatus.publish
        ]

    def _public_summary(self, row: CaseStudy) -> PublicCaseStudySummary:
        return PublicCaseStudySummary(
            heading=row.heading,
            slug=row.slug,
            short_heading=row.short_heading,
            description=row.description,
            order=row.sort_order,
            date=row.occurred_on,
            image_key=row.image_key,
            image_alt=row.image_alt,
            industries=self._public_industries(row),
            categories=self._public_categories(row),
        )

    def _public_detail(self, row: CaseStudy) -> PublicCaseStudyDetail:
        return PublicCaseStudyDetail(
            heading=row.heading,
            slug=row.slug,
            short_heading=row.short_heading,
            description=row.description,
            body=row.body,
            order=row.sort_order,
            date=row.occurred_on,
            image_key=row.image_key,
            image_alt=row.image_alt,
            content_available_in=list(row.content_available_in or [DEFAULT_LOCALE]),
            industries=self._public_industries(row),
            categories=self._public_categories(row),
        )
