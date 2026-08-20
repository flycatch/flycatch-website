from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.client_logo import ClientLogo
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_client_logos import (
    ClientLogo as ClientLogoSchema,
)
from flycatch_api.schemas.admin_client_logos import (
    ClientLogoList,
    ClientLogoSummary,
    ClientLogoWrite,
)
from flycatch_api.schemas.public_client_logos import PublicClientLogo, PublicClientLogoList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, coerce_status


def logo_schema(logo: ClientLogo) -> ClientLogoSchema:
    return ClientLogoSchema(
        id=logo.id,
        colour_logo_key=logo.colour_logo_key,
        white_logo_key=logo.white_logo_key,
        alt_text=logo.alt_text,
        status=logo.status,
        created_at=logo.created_at,
    )


def public_logo(logo: ClientLogo) -> PublicClientLogo:
    return PublicClientLogo(
        colour_logo_key=logo.colour_logo_key,
        white_logo_key=logo.white_logo_key,
        alt_text=logo.alt_text,
    )


class ClientLogoService:
    def list_logos(self, db: Session, q: str | None, page: int, per_page: int) -> ClientLogoList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(ClientLogo)
        if q and q.strip():
            query = query.filter(ClientLogo.alt_text.ilike(f"%{q.strip()}%"))
        total = query.count()
        rows = (
            query.order_by(ClientLogo.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return ClientLogoList(
            items=[
                ClientLogoSummary(
                    id=row.id,
                    colour_logo_key=row.colour_logo_key,
                    white_logo_key=row.white_logo_key,
                    alt_text=row.alt_text,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session) -> PublicClientLogoList:
        rows = (
            db.query(ClientLogo)
            .filter(ClientLogo.status == ContentStatus.publish)
            .order_by(ClientLogo.created_at.asc())
            .all()
        )
        return PublicClientLogoList(items=[public_logo(row) for row in rows])

    def get(self, db: Session, logo_id: UUID) -> ClientLogoSchema:
        logo = db.get(ClientLogo, logo_id)
        if logo is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.client_logos.not_found").model_dump(),
            )
        return logo_schema(logo)

    def create(self, db: Session, payload: ClientLogoWrite) -> ClientLogoSchema:
        alt_text = self._validate_alt(payload.alt_text)
        logo = ClientLogo(
            colour_logo_key=payload.colour_logo_key or None,
            white_logo_key=payload.white_logo_key or None,
            alt_text=alt_text,
            status=coerce_status(payload.status),
            created_at=datetime.now(UTC),
        )
        db.add(logo)
        db.commit()
        db.refresh(logo)
        return logo_schema(logo)

    def update(self, db: Session, logo_id: UUID, payload: ClientLogoWrite) -> ClientLogoSchema:
        logo = db.get(ClientLogo, logo_id)
        if logo is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.client_logos.not_found").model_dump(),
            )
        logo.colour_logo_key = payload.colour_logo_key or None
        logo.white_logo_key = payload.white_logo_key or None
        logo.alt_text = self._validate_alt(payload.alt_text)
        logo.status = coerce_status(payload.status)
        db.commit()
        db.refresh(logo)
        return logo_schema(logo)

    def delete(self, db: Session, logo_id: UUID) -> None:
        logo = db.get(ClientLogo, logo_id)
        if logo is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.client_logos.not_found").model_dump(),
            )
        db.delete(logo)
        db.commit()

    def _validate_alt(self, alt_text: str) -> str:
        trimmed = alt_text.strip()
        if not trimmed:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"alt_text": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        return trimmed
