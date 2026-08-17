from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from flycatch_api.db import Base

if TYPE_CHECKING:
    from flycatch_api.models.role import Role


class PermissionName(str, enum.Enum):
    records_view = "records.view"
    drafts_save = "drafts.save"
    records_publish = "records.publish"
    roles_manage = "roles.manage"


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True
    )
    permission: Mapped[str] = mapped_column(String(64), primary_key=True)

    role: Mapped[Role] = relationship(back_populates="permissions")
