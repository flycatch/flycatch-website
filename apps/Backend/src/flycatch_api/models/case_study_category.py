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


class CaseStudyCategory(Base):
    __tablename__ = "case_study_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    case_studies: Mapped[list[CaseStudyCategoryLink]] = relationship(back_populates="category")


class CaseStudyCategoryLink(Base):
    __tablename__ = "case_study_category_links"
    __table_args__ = (
        UniqueConstraint("case_study_id", "category_id", name="uq_case_study_category"),
    )

    case_study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("case_studies.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("case_study_categories.id"), primary_key=True
    )

    case_study: Mapped[CaseStudy] = relationship(back_populates="category_links")
    category: Mapped[CaseStudyCategory] = relationship(back_populates="case_studies")
