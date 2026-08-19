from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from flycatch_api.db import Base

if TYPE_CHECKING:
    from flycatch_api.models.author import BlogAuthor
    from flycatch_api.models.category import BlogCategory


class BlogStatus(enum.StrEnum):
    draft = "draft"
    publish = "publish"


class Blog(Base):
    __tablename__ = "blogs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[BlogStatus] = mapped_column(
        Enum(BlogStatus, name="blog_status"), nullable=False, default=BlogStatus.draft
    )
    reading_time: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_alt: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    canonical_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    facebook: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    linkedin: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    twitter: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    instagram: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    content_available_in: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    author_links: Mapped[list[BlogAuthor]] = relationship(
        back_populates="blog", cascade="all, delete-orphan"
    )
    category_links: Mapped[list[BlogCategory]] = relationship(
        back_populates="blog", cascade="all, delete-orphan"
    )
