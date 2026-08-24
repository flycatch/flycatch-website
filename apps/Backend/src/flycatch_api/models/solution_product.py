from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus


class SolutionProduct(Base):
    __tablename__ = "solution_products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_title: Mapped[str] = mapped_column(String(200), nullable=False)
    product_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    product_tag: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    product_logo_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_card_image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_banner_image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    card_image_on_right: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    banner_image_on_right: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
