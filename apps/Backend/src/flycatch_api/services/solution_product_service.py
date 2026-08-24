from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.solution_product import SolutionProduct
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_solution_products import (
    SolutionProduct as SolutionProductSchema,
)
from flycatch_api.schemas.admin_solution_products import (
    SolutionProductList,
    SolutionProductSummary,
    SolutionProductWrite,
)
from flycatch_api.schemas.public_solution_products import (
    PublicSolutionProduct,
    PublicSolutionProductList,
    PublicSolutionProductSummary,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.text import is_valid_media_key, is_valid_slug, slugify


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


def product_schema(row: SolutionProduct) -> SolutionProductSchema:
    return SolutionProductSchema(
        id=row.id,
        product_title=row.product_title,
        product_description=row.product_description,
        product_tag=row.product_tag,
        product_logo_key=row.product_logo_key,
        product_card_image_key=row.product_card_image_key,
        product_banner_image_key=row.product_banner_image_key,
        card_image_on_right=row.card_image_on_right,
        banner_image_on_right=row.banner_image_on_right,
        slug=row.slug,
        order=row.order,
        status=row.status,
        created_at=row.created_at,
    )


def public_product(row: SolutionProduct) -> PublicSolutionProduct:
    return PublicSolutionProduct(
        product_title=row.product_title,
        product_description=row.product_description,
        product_tag=row.product_tag,
        product_logo_key=row.product_logo_key,
        product_card_image_key=row.product_card_image_key,
        product_banner_image_key=row.product_banner_image_key,
        card_image_on_right=row.card_image_on_right,
        banner_image_on_right=row.banner_image_on_right,
        slug=row.slug,
        order=row.order,
    )


class SolutionProductService:
    def list_products(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> SolutionProductList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=False)
        return SolutionProductList(
            items=[
                SolutionProductSummary(
                    id=row.id,
                    product_title=row.product_title,
                    product_description=row.product_description,
                    product_tag=row.product_tag,
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
    ) -> PublicSolutionProductList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=True)
        return PublicSolutionProductList(
            items=[
                PublicSolutionProductSummary(
                    slug=row.slug,
                    product_title=row.product_title,
                    product_description=row.product_description,
                    product_tag=row.product_tag,
                    product_logo_key=row.product_logo_key,
                    product_card_image_key=row.product_card_image_key,
                    card_image_on_right=row.card_image_on_right,
                    order=row.order,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get_published_by_slug(self, db: Session, slug: str) -> PublicSolutionProduct:
        row = (
            db.query(SolutionProduct)
            .filter(
                func.lower(SolutionProduct.slug) == slug.strip().lower(),
                SolutionProduct.status == ContentStatus.publish,
            )
            .first()
        )
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="public.solution_products.not_found").model_dump(),
            )
        return public_product(row)

    def get(self, db: Session, product_id: UUID) -> SolutionProductSchema:
        return product_schema(self._row(db, product_id))

    def create(self, db: Session, payload: SolutionProductWrite) -> SolutionProductSchema:
        now = datetime.now(UTC)
        row = SolutionProduct(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return product_schema(row)

    def update(
        self, db: Session, product_id: UUID, payload: SolutionProductWrite
    ) -> SolutionProductSchema:
        row = self._row(db, product_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return product_schema(row)

    def delete(self, db: Session, product_id: UUID) -> None:
        row = self._row(db, product_id)
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
    ) -> tuple[int, int, list[SolutionProduct], int]:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(SolutionProduct)
        if published_only:
            query = query.filter(SolutionProduct.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    SolutionProduct.product_title.ilike(term),
                    SolutionProduct.product_tag.ilike(term),
                    SolutionProduct.slug.ilike(term),
                )
            )
        total = query.count()
        order = (
            SolutionProduct.order.asc()
            if published_only
            else SolutionProduct.created_at.desc()
        )
        rows = query.order_by(order).offset((page - 1) * per_page).limit(per_page).all()
        return page, per_page, rows, total

    def _row(self, db: Session, product_id: UUID) -> SolutionProduct:
        row = db.get(SolutionProduct, product_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.solution_products.not_found").model_dump(),
            )
        return row

    def _apply(
        self,
        db: Session,
        row: SolutionProduct,
        payload: SolutionProductWrite,
        product_id: UUID | None,
    ) -> None:
        title = payload.product_title.strip()
        if not title:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"product_title": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        slug = slugify(payload.slug) or slugify(title)
        if not is_valid_slug(slug):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "slug": FieldErrorDetail(message_key="admin.solution_products.slug.invalid")
                    }
                ).model_dump(),
            )
        existing = (
            db.query(SolutionProduct)
            .filter(func.lower(SolutionProduct.slug) == slug.lower())
            .first()
        )
        if existing is not None and existing.id != product_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "slug": FieldErrorDetail(
                            message_key="admin.solution_products.slug.duplicate"
                        )
                    }
                ).model_dump(),
            )
        row.product_title = title
        row.product_description = payload.product_description.strip()
        row.product_tag = payload.product_tag.strip()
        row.product_logo_key = _optional_key(payload.product_logo_key, "product_logo_key")
        row.product_card_image_key = _optional_key(
            payload.product_card_image_key, "product_card_image_key"
        )
        row.product_banner_image_key = _optional_key(
            payload.product_banner_image_key, "product_banner_image_key"
        )
        row.card_image_on_right = payload.card_image_on_right
        row.banner_image_on_right = payload.banner_image_on_right
        row.slug = slug
        row.order = payload.order
        row.status = coerce_status(payload.status)
