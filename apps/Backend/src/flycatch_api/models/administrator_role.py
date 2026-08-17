from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from flycatch_api.db import Base

if TYPE_CHECKING:
    from flycatch_api.models.administrator import Administrator
    from flycatch_api.models.role import Role


class AdministratorRole(Base):
    __tablename__ = "administrator_roles"

    administrator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("administrators.id"), primary_key=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    assigned_by: Mapped[str] = mapped_column(String(255), nullable=False)

    administrator: Mapped[Administrator] = relationship(back_populates="role_assignments")
    role: Mapped[Role] = relationship(back_populates="administrator_roles")
