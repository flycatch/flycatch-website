from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus


class ClientTestimonial(Base):
    __tablename__ = "client_testimonials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_name: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    review: Mapped[str] = mapped_column(Text, nullable=False)
    client_designation: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    client_company: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    country: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alt_text: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    is_clutch_review: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column("order", Integer, nullable=False, default=0)
    review_link: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    content_available_in: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
