from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus


class SolutionDetail(Base):
    __tablename__ = "solution_details"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    banner: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    introduction: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    challenges: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    benefits: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    solutions_section: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    cta: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    seo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
