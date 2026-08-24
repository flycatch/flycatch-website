from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.solution import Solution
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.admin_solutions import (
    Solution as SolutionSchema,
)
from flycatch_api.schemas.admin_solutions import (
    SolutionList,
    SolutionSummary,
    SolutionWrite,
)
from flycatch_api.schemas.public_solutions import PublicSolution, PublicSolutionList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.text import is_valid_media_key


def _optional_key(value: str | None, field: str) -> str | None:
    key = value or None
    if key and not is_valid_media_key(key):
        raise CatalogError(
            422,
            FieldErrors(
                fields={field: FieldErrorDetail(message_key="admin.media.type.invalid")}
            ).model_dump(),
        )
    return key


def _seo(payload: ContentSeo) -> dict:
    image_key = _optional_key(payload.image_key, "seo.image_key")
    return {
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "canonical_url": payload.canonical_url.strip(),
        "meta_title": payload.meta_title.strip(),
        "h1_tag": payload.h1_tag.strip(),
        "image_alt": payload.image_alt.strip(),
        "image_key": image_key,
    }


def solution_schema(row: Solution) -> SolutionSchema:
    return SolutionSchema(
        id=row.id,
        banner_image_key=row.banner_image_key,
        banner_title=row.banner_title,
        section_title=row.section_title,
        seo=ContentSeo.model_validate(row.seo or {}),
        status=row.status,
        created_at=row.created_at,
    )


def public_solution(row: Solution) -> PublicSolution:
    return PublicSolution(
        banner_image_key=row.banner_image_key,
        banner_title=row.banner_title,
        section_title=row.section_title,
        seo=ContentSeo.model_validate(row.seo or {}),
    )


class SolutionService:
    def list_solutions(self, db: Session, q: str | None, page: int, per_page: int) -> SolutionList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(Solution)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(Solution.banner_title.ilike(term), Solution.section_title.ilike(term))
            )
        total = query.count()
        rows = (
            query.order_by(Solution.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return SolutionList(
            items=[
                SolutionSummary(
                    id=row.id,
                    banner_image_key=row.banner_image_key,
                    banner_title=row.banner_title,
                    section_title=row.section_title,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session) -> PublicSolutionList:
        rows = (
            db.query(Solution)
            .filter(Solution.status == ContentStatus.publish)
            .order_by(Solution.created_at.asc())
            .all()
        )
        return PublicSolutionList(items=[public_solution(row) for row in rows])

    def get(self, db: Session, solution_id: UUID) -> SolutionSchema:
        return solution_schema(self._row(db, solution_id))

    def create(self, db: Session, payload: SolutionWrite) -> SolutionSchema:
        now = datetime.now(UTC)
        row = Solution(created_at=now, updated_at=now)
        self._apply(row, payload)
        db.add(row)
        db.commit()
        return solution_schema(row)

    def update(self, db: Session, solution_id: UUID, payload: SolutionWrite) -> SolutionSchema:
        row = self._row(db, solution_id)
        self._apply(row, payload)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return solution_schema(row)

    def delete(self, db: Session, solution_id: UUID) -> None:
        row = self._row(db, solution_id)
        db.delete(row)
        db.commit()

    def _row(self, db: Session, solution_id: UUID) -> Solution:
        row = db.get(Solution, solution_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.solutions.not_found").model_dump(),
            )
        return row

    def _apply(self, row: Solution, payload: SolutionWrite) -> None:
        row.banner_image_key = _optional_key(payload.banner_image_key, "banner_image_key")
        row.banner_title = payload.banner_title.strip()
        row.section_title = payload.section_title.strip()
        row.seo = _seo(payload.seo)
        row.status = coerce_status(payload.status)
