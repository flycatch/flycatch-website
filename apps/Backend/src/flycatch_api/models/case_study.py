from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from flycatch_api.db import Base

if TYPE_CHECKING:
    from flycatch_api.models.case_study_category import CaseStudyCategoryLink
    from flycatch_api.models.industry import CaseStudyIndustry


class ContentStatus(enum.StrEnum):
    draft = "draft"
    publish = "publish"


class CaseStudy(Base):
    __tablename__ = "case_studies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    heading: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    short_heading: Mapped[str] = mapped_column(Text, nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column("order", Integer, nullable=False, default=0)
    occurred_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_alt: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    content_available_in: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    industry_links: Mapped[list[CaseStudyIndustry]] = relationship(
        back_populates="case_study", cascade="all, delete-orphan"
    )
    category_links: Mapped[list[CaseStudyCategoryLink]] = relationship(
        back_populates="case_study", cascade="all, delete-orphan"
    )
