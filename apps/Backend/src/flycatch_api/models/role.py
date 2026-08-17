from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from flycatch_api.db import Base

if TYPE_CHECKING:
    from flycatch_api.models.administrator_role import AdministratorRole
    from flycatch_api.models.role_permission import RolePermission


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    permissions: Mapped[list[RolePermission]] = relationship(back_populates="role")
    administrator_roles: Mapped[list[AdministratorRole]] = relationship(back_populates="role")
