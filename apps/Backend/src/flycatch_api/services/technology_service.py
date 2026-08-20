from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.models import CaseStudyTechnology, Technology
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import (
    EntityInUse,
    EntityNotFound,
    TechnologyList,
    TechnologySummary,
    TechnologyWrite,
)
from flycatch_api.schemas.admin_case_studies import (
    Technology as TechnologySchema,
)
from flycatch_api.schemas.public_case_studies import PublicTechnology, PublicTechnologyList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, coerce_status


def technology_schema(technology: Technology) -> TechnologySchema:
    return TechnologySchema(
        id=technology.id,
        name=technology.name,
        logo_key=technology.logo_key,
        status=technology.status,
        created_at=technology.created_at,
    )


def public_technology(technology: Technology) -> PublicTechnology:
    return PublicTechnology(name=technology.name, logo_key=technology.logo_key)


class TechnologyService:
    def list_technologies(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> TechnologyList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(Technology)
        if q and q.strip():
            query = query.filter(Technology.name.ilike(f"%{q.strip()}%"))
        total = query.count()
        rows = (
            query.order_by(Technology.name.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return TechnologyList(
            items=[
                TechnologySummary(
                    id=row.id,
                    name=row.name,
                    logo_key=row.logo_key,
                    created_at=row.created_at,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session) -> PublicTechnologyList:
        rows = (
            db.query(Technology)
            .filter(Technology.status == ContentStatus.publish)
            .order_by(Technology.name.asc())
            .all()
        )
        return PublicTechnologyList(items=[public_technology(row) for row in rows])

    def get(self, db: Session, technology_id: UUID) -> TechnologySchema:
        technology = db.get(Technology, technology_id)
        if technology is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.technologies.not_found").model_dump(),
            )
        return technology_schema(technology)

    def create(self, db: Session, payload: TechnologyWrite) -> TechnologySchema:
        name = self._validate_name(db, payload.name, None)
        technology = Technology(
            name=name,
            logo_key=payload.logo_key or None,
            status=coerce_status(payload.status),
            created_at=datetime.now(UTC),
        )
        db.add(technology)
        db.commit()
        db.refresh(technology)
        return technology_schema(technology)

    def update(
        self, db: Session, technology_id: UUID, payload: TechnologyWrite
    ) -> TechnologySchema:
        technology = db.get(Technology, technology_id)
        if technology is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.technologies.not_found").model_dump(),
            )
        technology.name = self._validate_name(db, payload.name, technology.id)
        technology.logo_key = payload.logo_key or None
        technology.status = coerce_status(payload.status)
        db.commit()
        db.refresh(technology)
        return technology_schema(technology)

    def delete(self, db: Session, technology_id: UUID) -> None:
        technology = db.get(Technology, technology_id)
        if technology is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.technologies.not_found").model_dump(),
            )
        in_use = (
            db.query(CaseStudyTechnology)
            .filter(CaseStudyTechnology.technology_id == technology.id)
            .count()
        )
        if in_use:
            raise CatalogError(
                409,
                EntityInUse(message_key="admin.technologies.in_use").model_dump(),
            )
        db.delete(technology)
        db.commit()

    def _validate_name(self, db: Session, name: str, technology_id: UUID | None) -> str:
        trimmed = name.strip()
        if not trimmed:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        existing = (
            db.query(Technology)
            .filter(func.lower(Technology.name) == trimmed.lower())
            .first()
        )
        if existing is not None and existing.id != technology_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "name": FieldErrorDetail(message_key="admin.technologies.name.duplicate")
                    }
                ).model_dump(),
            )
        return trimmed
