from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from flycatch_api.models import Author, Blog, BlogAuthor, BlogCategory, Category
from flycatch_api.models.blog import BlogStatus
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_blogs import Author as AuthorSchema
from flycatch_api.schemas.admin_blogs import (
    BlogDetail,
    BlogList,
    BlogSummary,
    BlogWrite,
    EntityNotFound,
)
from flycatch_api.schemas.admin_blogs import (
    Category as CategorySchema,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.text import is_valid_slug, sanitize_html, slugify

PER_PAGE = 10
DEFAULT_LOCALE = "en"
LOCALE_LABEL = "En"


class BlogService:
    def list_blogs(self, db: Session, q: str | None, page: int, per_page: int) -> BlogList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(Blog)
        if q and q.strip():
            term = f"%{q.strip()}%"
            matching = (
                db.query(Blog.id)
                .outerjoin(BlogAuthor, BlogAuthor.blog_id == Blog.id)
                .outerjoin(Author, Author.id == BlogAuthor.author_id)
                .filter(
                    or_(
                        Blog.title.ilike(term),
                        Blog.slug.ilike(term),
                        Author.name.ilike(term),
                    )
                )
                .distinct()
            )
            query = query.filter(Blog.id.in_(matching))
        total = query.count()
        rows = (
            query.options(joinedload(Blog.author_links).joinedload(BlogAuthor.author))
            .order_by(Blog.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return BlogList(
            items=[self._summary(blog) for blog in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get(self, db: Session, blog_id: UUID) -> BlogDetail:
        blog = self._load(db, blog_id)
        return self._detail(blog)

    def create(self, db: Session, payload: BlogWrite) -> BlogDetail:
        now = datetime.now(UTC)
        blog = Blog(
            created_at=now,
            updated_at=now,
            content_available_in=[DEFAULT_LOCALE],
        )
        self._apply(db, blog, payload, None)
        db.add(blog)
        db.commit()
        return self.get(db, blog.id)

    def update(self, db: Session, blog_id: UUID, payload: BlogWrite) -> BlogDetail:
        blog = self._load(db, blog_id)
        self._apply(db, blog, payload, blog.id)
        blog.updated_at = datetime.now(UTC)
        db.commit()
        return self.get(db, blog.id)

    def delete(self, db: Session, blog_id: UUID) -> None:
        blog = self._load(db, blog_id)
        db.delete(blog)
        db.commit()

    def _load(self, db: Session, blog_id: UUID) -> Blog:
        blog = (
            db.query(Blog)
            .options(
                joinedload(Blog.author_links).joinedload(BlogAuthor.author),
                joinedload(Blog.category_links).joinedload(BlogCategory.category),
            )
            .filter(Blog.id == blog_id)
            .first()
        )
        if blog is None:
            raise CatalogError(
                404, EntityNotFound(message_key="admin.blogs.not_found").model_dump()
            )
        return blog

    def _apply(self, db: Session, blog: Blog, payload: BlogWrite, blog_id: UUID | None) -> None:
        title = payload.title.strip()
        if not title:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"title": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        slug = slugify(payload.slug) or slugify(title)
        if not is_valid_slug(slug):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"slug": FieldErrorDetail(message_key="admin.blogs.slug.invalid")}
                ).model_dump(),
            )
        existing = db.query(Blog).filter(func.lower(Blog.slug) == slug.lower()).first()
        if existing is not None and existing.id != blog_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"slug": FieldErrorDetail(message_key="admin.blogs.slug.duplicate")}
                ).model_dump(),
            )
        authors = self._authors(db, payload.author_ids)
        categories = self._categories(db, payload.category_ids)
        blog.title = title
        blog.slug = slug
        blog.description = payload.description.strip()
        blog.body = sanitize_html(payload.body)
        blog.status = (
            payload.status if isinstance(payload.status, BlogStatus) else BlogStatus(payload.status)
        )
        blog.reading_time = payload.reading_time
        blog.image_key = payload.image_key or None
        blog.image_alt = payload.image_alt.strip()
        blog.canonical_url = payload.canonical_url.strip()
        blog.facebook = payload.facebook.strip()
        blog.linkedin = payload.linkedin.strip()
        blog.twitter = payload.twitter.strip()
        blog.instagram = payload.instagram.strip()
        blog.full_name = payload.full_name.strip()
        blog.bio = payload.bio.strip()
        blog.designation = payload.designation.strip()
        blog.writer_image_keys = list(payload.writer_image_keys)
        blog.content_available_in = [DEFAULT_LOCALE]
        blog.author_links = [BlogAuthor(author=author) for author in authors]
        blog.category_links = [BlogCategory(category=category) for category in categories]

    def _authors(self, db: Session, ids: list[UUID]) -> list[Author]:
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(Author).filter(Author.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "author_ids": FieldErrorDetail(message_key="admin.blogs.authors.invalid")
                    }
                ).model_dump(),
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _categories(self, db: Session, ids: list[UUID]) -> list[Category]:
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(Category).filter(Category.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "category_ids": FieldErrorDetail(
                            message_key="admin.blogs.categories.invalid"
                        )
                    }
                ).model_dump(),
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _summary(self, blog: Blog) -> BlogSummary:
        names = [link.author.name for link in blog.author_links if link.author]
        return BlogSummary(
            id=blog.id,
            title=blog.title,
            slug=blog.slug,
            author=", ".join(names),
            content_available_in=LOCALE_LABEL,
            state=blog.status,
        )

    def _detail(self, blog: Blog) -> BlogDetail:
        authors = [
            AuthorSchema(id=link.author.id, name=link.author.name) for link in blog.author_links
        ]
        categories = [
            CategorySchema(id=link.category.id, name=link.category.name)
            for link in blog.category_links
        ]
        return BlogDetail(
            id=blog.id,
            title=blog.title,
            slug=blog.slug,
            description=blog.description,
            body=blog.body,
            status=blog.status,
            reading_time=blog.reading_time,
            image_key=blog.image_key,
            image_alt=blog.image_alt,
            canonical_url=blog.canonical_url,
            facebook=blog.facebook,
            linkedin=blog.linkedin,
            twitter=blog.twitter,
            instagram=blog.instagram,
            full_name=blog.full_name,
            bio=blog.bio,
            designation=blog.designation,
            writer_image_keys=list(blog.writer_image_keys or []),
            content_available_in=list(blog.content_available_in or [DEFAULT_LOCALE]),
            author_ids=[item.id for item in authors],
            category_ids=[item.id for item in categories],
            authors=authors,
            categories=categories,
        )
