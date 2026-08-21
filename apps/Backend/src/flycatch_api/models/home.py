from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus

if TYPE_CHECKING:
    from flycatch_api.models.case_study import CaseStudy


class Home(Base):
    __tablename__ = "homes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    video_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    video_content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    banner_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    seo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    services: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    banner_explore_text: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    faq_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    faq_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    faqs: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    content_available_in: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    case_study_links: Mapped[list[HomeCaseStudy]] = relationship(
        back_populates="home",
        cascade="all, delete-orphan",
        order_by="HomeCaseStudy.sort_order",
    )


class HomeCaseStudy(Base):
    __tablename__ = "home_case_studies"
    __table_args__ = (UniqueConstraint("home_id", "case_study_id", name="uq_home_case_study"),)

    home_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("homes.id", ondelete="CASCADE"), primary_key=True
    )
    case_study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("case_studies.id"), primary_key=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    home: Mapped[Home] = relationship(back_populates="case_study_links")
    case_study: Mapped[CaseStudy] = relationship()
