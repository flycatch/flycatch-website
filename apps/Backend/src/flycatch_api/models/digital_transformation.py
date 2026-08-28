from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus


class DigitalTransformation(Base):
    __tablename__ = "digital_transformations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    banner_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    banner_image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    banner_tag_line: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    introduction_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    introduction_first_paragraph: Mapped[str] = mapped_column(Text, nullable=False, default="")
    introduction_second_paragraph: Mapped[str] = mapped_column(Text, nullable=False, default="")
    accordion: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    outcomes_image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    outcomes_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    outcomes_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
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
