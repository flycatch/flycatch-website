from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.client_testimonial import ClientTestimonial
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_client_testimonials import (
    ClientTestimonial as ClientTestimonialSchema,
)
from flycatch_api.schemas.admin_client_testimonials import (
    ClientTestimonialList,
    ClientTestimonialSummary,
    ClientTestimonialWrite,
)
from flycatch_api.schemas.public_client_testimonials import (
    PublicClientTestimonial,
    PublicClientTestimonialList,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, coerce_status

DEFAULT_LOCALE = "en"
LOCALE_LABEL = "En"


def testimonial_schema(row: ClientTestimonial) -> ClientTestimonialSchema:
    return ClientTestimonialSchema(
        id=row.id,
        client_name=row.client_name,
        title=row.title,
        review=row.review,
        client_designation=row.client_designation,
        client_company=row.client_company,
        country=row.country,
        image_key=row.image_key,
        alt_text=row.alt_text,
        is_clutch_review=row.is_clutch_review,
        order=row.sort_order,
        review_link=row.review_link,
        content_available_in=list(row.content_available_in or [DEFAULT_LOCALE]),
        status=row.status,
        created_at=row.created_at,
    )


def public_testimonial(row: ClientTestimonial) -> PublicClientTestimonial:
    return PublicClientTestimonial(
        client_name=row.client_name,
        title=row.title,
        review=row.review,
        client_designation=row.client_designation,
        client_company=row.client_company,
        country=row.country,
        image_key=row.image_key,
        alt_text=row.alt_text,
        is_clutch_review=row.is_clutch_review,
        order=row.sort_order,
        review_link=row.review_link,
        content_available_in=list(row.content_available_in or [DEFAULT_LOCALE]),
    )


class ClientTestimonialService:
    def list_testimonials(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> ClientTestimonialList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(ClientTestimonial)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    ClientTestimonial.client_name.ilike(term),
                    ClientTestimonial.title.ilike(term),
                    ClientTestimonial.review.ilike(term),
                )
            )
        total = query.count()
        rows = (
            query.order_by(ClientTestimonial.sort_order.asc(), ClientTestimonial.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return ClientTestimonialList(
            items=[
                ClientTestimonialSummary(
                    id=row.id,
                    client_name=row.client_name,
                    title=row.title,
                    review=row.review,
                    content_available_in=LOCALE_LABEL,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session) -> PublicClientTestimonialList:
        rows = (
            db.query(ClientTestimonial)
            .filter(ClientTestimonial.status == ContentStatus.publish)
            .order_by(ClientTestimonial.sort_order.asc(), ClientTestimonial.created_at.asc())
            .all()
        )
        return PublicClientTestimonialList(items=[public_testimonial(row) for row in rows])

    def get(self, db: Session, testimonial_id: UUID) -> ClientTestimonialSchema:
        row = db.get(ClientTestimonial, testimonial_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.client_testimonials.not_found").model_dump(),
            )
        return testimonial_schema(row)

    def create(self, db: Session, payload: ClientTestimonialWrite) -> ClientTestimonialSchema:
        row = ClientTestimonial(
            client_name=self._required(payload.client_name, "client_name"),
            title=self._required(payload.title, "title"),
            review=self._required(payload.review, "review"),
            client_designation=payload.client_designation.strip(),
            client_company=payload.client_company.strip(),
            country=payload.country.strip(),
            image_key=payload.image_key or None,
            alt_text=payload.alt_text.strip(),
            is_clutch_review=payload.is_clutch_review,
            sort_order=payload.order,
            review_link=payload.review_link.strip(),
            content_available_in=[DEFAULT_LOCALE],
            status=coerce_status(payload.status),
            created_at=datetime.now(UTC),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return testimonial_schema(row)

    def update(
        self, db: Session, testimonial_id: UUID, payload: ClientTestimonialWrite
    ) -> ClientTestimonialSchema:
        row = db.get(ClientTestimonial, testimonial_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.client_testimonials.not_found").model_dump(),
            )
        row.client_name = self._required(payload.client_name, "client_name")
        row.title = self._required(payload.title, "title")
        row.review = self._required(payload.review, "review")
        row.client_designation = payload.client_designation.strip()
        row.client_company = payload.client_company.strip()
        row.country = payload.country.strip()
        row.image_key = payload.image_key or None
        row.alt_text = payload.alt_text.strip()
        row.is_clutch_review = payload.is_clutch_review
        row.sort_order = payload.order
        row.review_link = payload.review_link.strip()
        row.content_available_in = [DEFAULT_LOCALE]
        row.status = coerce_status(payload.status)
        db.commit()
        db.refresh(row)
        return testimonial_schema(row)

    def delete(self, db: Session, testimonial_id: UUID) -> None:
        row = db.get(ClientTestimonial, testimonial_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.client_testimonials.not_found").model_dump(),
            )
        db.delete(row)
        db.commit()

    def _required(self, value: str, field: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={field: FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        return trimmed
