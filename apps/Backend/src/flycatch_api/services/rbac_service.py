from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from flycatch_api.models import AdministratorRole, PermissionName, Role, RolePermission


class RbacService:
    def role_names(self, db: Session, administrator_id: UUID) -> list[str]:
        rows = (
            db.query(Role.name)
            .join(AdministratorRole, AdministratorRole.role_id == Role.id)
            .filter(AdministratorRole.administrator_id == administrator_id)
            .all()
        )
        return sorted({name for (name,) in rows})

    def permissions(self, db: Session, administrator_id: UUID) -> list[str]:
        rows = (
            db.query(RolePermission.permission)
            .join(Role, Role.id == RolePermission.role_id)
            .join(AdministratorRole, AdministratorRole.role_id == Role.id)
            .filter(AdministratorRole.administrator_id == administrator_id)
            .all()
        )
        values = {
            permission.value if isinstance(permission, PermissionName) else str(permission)
            for (permission,) in rows
        }
        return sorted(values)

    def has_permission(
        self, db: Session, administrator_id: UUID, permission: PermissionName | str
    ) -> bool:
        required = permission.value if isinstance(permission, PermissionName) else permission
        return required in self.permissions(db, administrator_id)
