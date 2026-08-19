from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from flycatch_api.db import Base

if TYPE_CHECKING:
    from flycatch_api.models.blog import Blog


class Author(Base):
    __tablename__ = "authors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    designation: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    writer_image_keys: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    blogs: Mapped[list[BlogAuthor]] = relationship(back_populates="author")


class BlogAuthor(Base):
    __tablename__ = "blog_authors"
    __table_args__ = (UniqueConstraint("blog_id", "author_id", name="uq_blog_author"),)

    blog_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blogs.id", ondelete="CASCADE"), primary_key=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("authors.id"), primary_key=True
    )

    blog: Mapped[Blog] = relationship(back_populates="author_links")
    author: Mapped[Author] = relationship(back_populates="blogs")
