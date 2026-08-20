from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.models import CaseStudyCategory, CaseStudyCategoryLink
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import (
    CaseStudyCategory as CategorySchema,
)
from flycatch_api.schemas.admin_case_studies import (
    CaseStudyCategoryList,
    CaseStudyCategorySummary,
    CaseStudyCategoryWrite,
    EntityInUse,
    EntityNotFound,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, coerce_status


def category_counts(db: Session, category_ids: list[UUID]) -> dict[UUID, int]:
    if not category_ids:
        return {}
    rows = (
        db.query(CaseStudyCategoryLink.category_id, func.count())
        .filter(CaseStudyCategoryLink.category_id.in_(category_ids))
        .group_by(CaseStudyCategoryLink.category_id)
        .all()
    )
    return {row[0]: int(row[1]) for row in rows}


def category_schema(db: Session, category: CaseStudyCategory) -> CategorySchema:
    counts = category_counts(db, [category.id])
    return CategorySchema(
        id=category.id,
        name=category.name,
        status=category.status,
        created_at=category.created_at,
        case_studies=counts.get(category.id, 0),
    )


class CaseStudyCategoryService:
    def list_categories(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> CaseStudyCategoryList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(CaseStudyCategory)
        if q and q.strip():
            query = query.filter(CaseStudyCategory.name.ilike(f"%{q.strip()}%"))
        total = query.count()
        rows = (
            query.order_by(CaseStudyCategory.name.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        counts = category_counts(db, [row.id for row in rows])
        return CaseStudyCategoryList(
            items=[
                CaseStudyCategorySummary(
                    id=row.id,
                    name=row.name,
                    case_studies=counts.get(row.id, 0),
                    created_at=row.created_at,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get(self, db: Session, category_id: UUID) -> CategorySchema:
        category = db.get(CaseStudyCategory, category_id)
        if category is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.case_study_categories.not_found").model_dump(),
            )
        return category_schema(db, category)

    def create(self, db: Session, payload: CaseStudyCategoryWrite) -> CategorySchema:
        name = self._validate_name(db, payload.name, None)
        category = CaseStudyCategory(
            name=name,
            status=coerce_status(payload.status),
            created_at=datetime.now(UTC),
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category_schema(db, category)

    def update(
        self, db: Session, category_id: UUID, payload: CaseStudyCategoryWrite
    ) -> CategorySchema:
        category = db.get(CaseStudyCategory, category_id)
        if category is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.case_study_categories.not_found").model_dump(),
            )
        category.name = self._validate_name(db, payload.name, category.id)
        category.status = coerce_status(payload.status)
        db.commit()
        db.refresh(category)
        return category_schema(db, category)

    def delete(self, db: Session, category_id: UUID) -> None:
        category = db.get(CaseStudyCategory, category_id)
        if category is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.case_study_categories.not_found").model_dump(),
            )
        in_use = (
            db.query(CaseStudyCategoryLink)
            .filter(CaseStudyCategoryLink.category_id == category.id)
            .count()
        )
        if in_use:
            raise CatalogError(
                409,
                EntityInUse(message_key="admin.case_study_categories.in_use").model_dump(),
            )
        db.delete(category)
        db.commit()

    def _validate_name(self, db: Session, name: str, category_id: UUID | None) -> str:
        trimmed = name.strip()
        if not trimmed:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        existing = (
            db.query(CaseStudyCategory)
            .filter(func.lower(CaseStudyCategory.name) == trimmed.lower())
            .first()
        )
        if existing is not None and existing.id != category_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "name": FieldErrorDetail(
                            message_key="admin.case_study_categories.name.duplicate"
                        )
                    }
                ).model_dump(),
            )
        return trimmed
