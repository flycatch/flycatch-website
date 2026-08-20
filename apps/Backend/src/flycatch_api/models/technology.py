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
    from flycatch_api.models.case_study import CaseStudy


class Technology(Base):
    __tablename__ = "technologies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    logo_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    case_studies: Mapped[list[CaseStudyTechnology]] = relationship(back_populates="technology")


class CaseStudyTechnology(Base):
    __tablename__ = "case_study_technologies"
    __table_args__ = (
        UniqueConstraint("case_study_id", "technology_id", name="uq_case_study_technology"),
    )

    case_study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("case_studies.id", ondelete="CASCADE"), primary_key=True
    )
    technology_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("technologies.id"), primary_key=True
    )

    case_study: Mapped[CaseStudy] = relationship(back_populates="technology_links")
    technology: Mapped[Technology] = relationship(back_populates="case_studies")
