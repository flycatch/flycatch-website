from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.models import CaseStudyIndustry, Industry
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import (
    EntityInUse,
    EntityNotFound,
    IndustryList,
    IndustrySummary,
    IndustryWrite,
)
from flycatch_api.schemas.admin_case_studies import (
    Industry as IndustrySchema,
)
from flycatch_api.services.author_service import CatalogError

PER_PAGE = 10


def coerce_status(value: ContentStatus | str) -> ContentStatus:
    return value if isinstance(value, ContentStatus) else ContentStatus(value)


def industry_schema(industry: Industry) -> IndustrySchema:
    return IndustrySchema(
        id=industry.id,
        name=industry.name,
        status=industry.status,
        created_at=industry.created_at,
    )


class IndustryService:
    def list_industries(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> IndustryList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(Industry)
        if q and q.strip():
            query = query.filter(Industry.name.ilike(f"%{q.strip()}%"))
        total = query.count()
        rows = (
            query.order_by(Industry.name.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return IndustryList(
            items=[
                IndustrySummary(
                    id=row.id,
                    name=row.name,
                    created_at=row.created_at,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get(self, db: Session, industry_id: UUID) -> IndustrySchema:
        industry = db.get(Industry, industry_id)
        if industry is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.industries.not_found").model_dump()
            )
        return industry_schema(industry)

    def create(self, db: Session, payload: IndustryWrite) -> IndustrySchema:
        name = self._validate_name(db, payload.name, None)
        industry = Industry(
            name=name,
            status=coerce_status(payload.status),
            created_at=datetime.now(UTC),
        )
        db.add(industry)
        db.commit()
        db.refresh(industry)
        return industry_schema(industry)

    def update(self, db: Session, industry_id: UUID, payload: IndustryWrite) -> IndustrySchema:
        industry = db.get(Industry, industry_id)
        if industry is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.industries.not_found").model_dump()
            )
        industry.name = self._validate_name(db, payload.name, industry.id)
        industry.status = coerce_status(payload.status)
        db.commit()
        db.refresh(industry)
        return industry_schema(industry)

    def delete(self, db: Session, industry_id: UUID) -> None:
        industry = db.get(Industry, industry_id)
        if industry is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.industries.not_found").model_dump()
            )
        in_use = (
            db.query(CaseStudyIndustry)
            .filter(CaseStudyIndustry.industry_id == industry.id)
            .count()
        )
        if in_use:
            raise CatalogError(
                409,
                EntityInUse(message_key="admin.industries.in_use").model_dump(),
            )
        db.delete(industry)
        db.commit()

    def _validate_name(self, db: Session, name: str, industry_id: UUID | None) -> str:
        trimmed = name.strip()
        if not trimmed:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        existing = (
            db.query(Industry).filter(func.lower(Industry.name) == trimmed.lower()).first()
        )
        if existing is not None and existing.id != industry_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "name": FieldErrorDetail(message_key="admin.industries.name.duplicate")
                    }
                ).model_dump(),
            )
        return trimmed
