from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from flycatch_api.db import Base

if TYPE_CHECKING:
    from flycatch_api.models.role import Role


class PermissionName(str, enum.Enum):
    records_view = "records.view"
    drafts_save = "drafts.save"
    records_publish = "records.publish"


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True
    )
    permission: Mapped[PermissionName] = mapped_column(
        Enum(
            PermissionName,
            name="permission_name",
            values_callable=lambda members: [member.value for member in members],
        ),
        primary_key=True,
    )

    role: Mapped[Role] = relationship(back_populates="permissions")
