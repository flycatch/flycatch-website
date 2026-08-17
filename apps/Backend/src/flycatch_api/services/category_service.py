from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.models import BlogCategory, Category
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_blogs import Category as CategorySchema
from flycatch_api.schemas.admin_blogs import (
    CategoryList,
    CategoryWrite,
    EntityInUse,
    EntityNotFound,
)
from flycatch_api.services.author_service import CatalogError


class CategoryService:
    def list_categories(self, db: Session) -> CategoryList:
        rows = db.query(Category).order_by(Category.name.asc()).all()
        return CategoryList(items=[self._to_schema(row) for row in rows])

    def get(self, db: Session, category_id: UUID) -> CategorySchema:
        category = db.get(Category, category_id)
        if category is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.categories.not_found").model_dump()
            )
        return self._to_schema(category)

    def create(self, db: Session, payload: CategoryWrite) -> CategorySchema:
        name = self._validate_name(db, payload.name, None)
        category = Category(name=name, created_at=datetime.now(UTC))
        db.add(category)
        db.commit()
        db.refresh(category)
        return self._to_schema(category)

    def update(self, db: Session, category_id: UUID, payload: CategoryWrite) -> CategorySchema:
        category = db.get(Category, category_id)
        if category is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.categories.not_found").model_dump()
            )
        category.name = self._validate_name(db, payload.name, category.id)
        db.commit()
        db.refresh(category)
        return self._to_schema(category)

    def delete(self, db: Session, category_id: UUID) -> None:
        category = db.get(Category, category_id)
        if category is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.categories.not_found").model_dump()
            )
        in_use = db.query(BlogCategory).filter(BlogCategory.category_id == category.id).count()
        if in_use:
            raise CatalogError(
                409,
                EntityInUse(message_key="admin.categories.in_use").model_dump(),
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
            db.query(Category).filter(func.lower(Category.name) == trimmed.lower()).first()
        )
        if existing is not None and existing.id != category_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.categories.name.duplicate")}
                ).model_dump(),
            )
        return trimmed

    def _to_schema(self, category: Category) -> CategorySchema:
        return CategorySchema(id=category.id, name=category.name)
