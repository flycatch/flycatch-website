from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus

if TYPE_CHECKING:
    from flycatch_api.models.blog import Blog


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    blogs: Mapped[list[BlogCategory]] = relationship(back_populates="category")


class BlogCategory(Base):
    __tablename__ = "blog_categories"
    __table_args__ = (UniqueConstraint("blog_id", "category_id", name="uq_blog_category"),)

    blog_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blogs.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), primary_key=True
    )

    blog: Mapped[Blog] = relationship(back_populates="category_links")
    category: Mapped[Category] = relationship(back_populates="blogs")
