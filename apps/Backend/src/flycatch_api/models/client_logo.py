from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus


class ClientLogo(Base):
    __tablename__ = "client_logos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colour_logo_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    white_logo_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alt_text: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
