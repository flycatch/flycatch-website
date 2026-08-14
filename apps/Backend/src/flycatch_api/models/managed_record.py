import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from flycatch_api.db import Base


class RecordType(str, enum.Enum):
    site_settings = "site_settings"
    page = "page"


class ManagedRecord(Base):
    __tablename__ = "managed_records"
    __table_args__ = (UniqueConstraint("type", "slug", name="uq_managed_record_type_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[RecordType] = mapped_column(Enum(RecordType), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), nullable=False)
    draft_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    published_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    draft_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    draft_updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("administrators.id"), nullable=True
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("administrators.id"), nullable=True
    )
