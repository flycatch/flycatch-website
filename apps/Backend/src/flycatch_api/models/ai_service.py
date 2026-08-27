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
    from flycatch_api.models.solution_detail import SolutionDetail


class AiService(Base):
    __tablename__ = "ai_services"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    banner_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    banner_image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    introduction_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    introduction_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    solutions_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    solutions_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    industry_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    industry_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    industry_items: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    ai_expertise_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    ai_expertise_image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ai_expertise_accordion: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    ai_expertise_accordion_description: Mapped[str] = mapped_column(
        Text, nullable=False, default=""
    )
    faq_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    faq_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    faq_accordion: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    seo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    solution_links: Mapped[list[AiServiceSolution]] = relationship(
        back_populates="ai_service",
        cascade="all, delete-orphan",
        order_by="AiServiceSolution.position",
    )


class AiServiceSolution(Base):
    __tablename__ = "ai_service_solutions"
    __table_args__ = (
        UniqueConstraint(
            "ai_service_id", "solution_detail_id", name="uq_ai_service_solution_detail"
        ),
    )

    ai_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_services.id", ondelete="CASCADE"), primary_key=True
    )
    solution_detail_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("solution_details.id"), primary_key=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    ai_service: Mapped[AiService] = relationship(back_populates="solution_links")
    solution_detail: Mapped[SolutionDetail] = relationship("SolutionDetail")
