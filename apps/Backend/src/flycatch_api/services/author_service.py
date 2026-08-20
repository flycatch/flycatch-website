from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.models import Author, BlogAuthor
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_blogs import Author as AuthorSchema
from flycatch_api.schemas.admin_blogs import AuthorList, AuthorWrite, EntityInUse, EntityNotFound
from flycatch_api.schemas.public_blogs import PublicAuthorList, PublicAuthorProfile


class CatalogError(Exception):
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self.payload = payload
        super().__init__(payload.get("message_key", "catalog_error"))


def coerce_status(value: ContentStatus | str) -> ContentStatus:
    return value if isinstance(value, ContentStatus) else ContentStatus(value)


class AuthorService:
    def list_authors(self, db: Session) -> AuthorList:
        rows = db.query(Author).order_by(Author.name.asc()).all()
        return AuthorList(items=[self._to_schema(row) for row in rows])

    def list_published(self, db: Session) -> PublicAuthorList:
        rows = (
            db.query(Author)
            .filter(Author.status == ContentStatus.publish)
            .order_by(Author.name.asc())
            .all()
        )
        return PublicAuthorList(items=[self._to_public(row) for row in rows])

    def get(self, db: Session, author_id: UUID) -> AuthorSchema:
        author = db.get(Author, author_id)
        if author is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.authors.not_found").model_dump()
            )
        return self._to_schema(author)

    def create(self, db: Session, payload: AuthorWrite) -> AuthorSchema:
        name = self._validate_name(db, payload.name, None)
        author = Author(
            name=name,
            status=coerce_status(payload.status),
            created_at=datetime.now(UTC),
        )
        self._apply_profile(author, payload)
        db.add(author)
        db.commit()
        db.refresh(author)
        return self._to_schema(author)

    def update(self, db: Session, author_id: UUID, payload: AuthorWrite) -> AuthorSchema:
        author = db.get(Author, author_id)
        if author is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.authors.not_found").model_dump()
            )
        author.name = self._validate_name(db, payload.name, author.id)
        author.status = coerce_status(payload.status)
        self._apply_profile(author, payload)
        db.commit()
        db.refresh(author)
        return self._to_schema(author)

    def delete(self, db: Session, author_id: UUID) -> None:
        author = db.get(Author, author_id)
        if author is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.authors.not_found").model_dump()
            )
        in_use = db.query(BlogAuthor).filter(BlogAuthor.author_id == author.id).count()
        if in_use:
            raise CatalogError(
                409,
                EntityInUse(message_key="admin.authors.in_use").model_dump(),
            )
        db.delete(author)
        db.commit()

    def _validate_name(self, db: Session, name: str, author_id: UUID | None) -> str:
        trimmed = name.strip()
        if not trimmed:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        existing = db.query(Author).filter(func.lower(Author.name) == trimmed.lower()).first()
        if existing is not None and existing.id != author_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.authors.name.duplicate")}
                ).model_dump(),
            )
        return trimmed

    def _apply_profile(self, author: Author, payload: AuthorWrite) -> None:
        author.bio = payload.bio.strip()
        author.designation = payload.designation.strip()
        author.writer_image_keys = list(payload.writer_image_keys)

    def _to_schema(self, author: Author) -> AuthorSchema:
        return author_schema(author)

    def _to_public(self, author: Author) -> PublicAuthorProfile:
        return PublicAuthorProfile(
            name=author.name,
            bio=author.bio or "",
            designation=author.designation or "",
            writer_image_keys=list(author.writer_image_keys or []),
        )


def author_schema(author: Author) -> AuthorSchema:
    return AuthorSchema(
        id=author.id,
        name=author.name,
        bio=author.bio or "",
        designation=author.designation or "",
        writer_image_keys=list(author.writer_image_keys or []),
        status=coerce_status(author.status),
    )
