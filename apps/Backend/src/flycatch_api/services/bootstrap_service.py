from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from flycatch_api.models import (
    Administrator,
    AdministratorRole,
    PermissionName,
    Role,
    RolePermission,
)
from flycatch_api.security.password import hash_password

ROLE_ADMINISTRATOR = "administrator"
ROLE_EDITOR = "editor"
CATALOGUE_ROLES = (ROLE_ADMINISTRATOR, ROLE_EDITOR)
CATALOGUE_PERMISSIONS: dict[str, tuple[PermissionName, ...]] = {
    ROLE_ADMINISTRATOR: (
        PermissionName.records_view,
        PermissionName.drafts_save,
        PermissionName.records_publish,
    ),
    ROLE_EDITOR: (
        PermissionName.records_view,
        PermissionName.drafts_save,
    ),
}


class BootstrapError(ValueError):
    """Fail-closed bootstrap input or state error."""


@dataclass(frozen=True)
class BootstrapUser:
    email: str
    password: str
    role: str


@dataclass
class BootstrapResult:
    created_roles: list[str]
    created_users: list[str]
    assigned: list[str]
    already_existed: bool

    def summary(self) -> str:
        if self.already_existed and not self.created_users and not self.created_roles:
            return "Defaults already exist"
        parts = []
        if self.created_roles:
            parts.append(f"created roles: {', '.join(self.created_roles)}")
        if self.created_users:
            parts.append(f"created users: {', '.join(self.created_users)}")
        if self.assigned:
            parts.append(f"assigned roles: {', '.join(self.assigned)}")
        return "; ".join(parts) if parts else "Defaults already exist"


class BootstrapService:
    def run(
        self,
        db: Session,
        user_1: BootstrapUser,
        user_2: BootstrapUser,
        created_by: str = "cli",
    ) -> BootstrapResult:
        self._validate(user_1, user_2)
        result = BootstrapResult(
            created_roles=[],
            created_users=[],
            assigned=[],
            already_existed=True,
        )
        try:
            self._ensure_catalogue(db, result)
            self._ensure_user(db, user_1, created_by, result)
            self._ensure_user(db, user_2, created_by, result)
            db.commit()
        except Exception:
            db.rollback()
            raise
        result.already_existed = not (result.created_roles or result.created_users or result.assigned)
        return result

    def _validate(self, user_1: BootstrapUser, user_2: BootstrapUser) -> None:
        if user_1.role != ROLE_ADMINISTRATOR:
            raise BootstrapError("User 1 must be assigned administrator")
        if user_2.role not in CATALOGUE_ROLES:
            raise BootstrapError("User 2 role must be administrator or editor")
        email_1 = user_1.email.strip().lower()
        email_2 = user_2.email.strip().lower()
        if not email_1 or not email_2:
            raise BootstrapError("Both user emails are required")
        if email_1 == email_2:
            raise BootstrapError("User emails must be distinct")
        if len(user_1.password) < 12 or len(user_2.password) < 12:
            raise BootstrapError("Passwords must be at least 12 characters")

    def _ensure_catalogue(self, db: Session, result: BootstrapResult) -> None:
        now = datetime.now(UTC)
        for name, permissions in CATALOGUE_PERMISSIONS.items():
            role = db.query(Role).filter(Role.name == name).first()
            if role is None:
                role = Role(name=name, created_at=now)
                db.add(role)
                db.flush()
                result.created_roles.append(name)
            existing = {grant.permission for grant in role.permissions}
            for permission in permissions:
                if permission not in existing:
                    db.add(RolePermission(role_id=role.id, permission=permission))
                    if name not in result.created_roles:
                        result.created_roles.append(f"{name}:{permission.value}")

    def _ensure_user(
        self,
        db: Session,
        user: BootstrapUser,
        created_by: str,
        result: BootstrapResult,
    ) -> None:
        email = user.email.strip().lower()
        admin = db.query(Administrator).filter(Administrator.email == email).first()
        if admin is None:
            admin = Administrator(
                email=email,
                password_hash=hash_password(user.password),
                is_active=True,
                created_at=datetime.now(UTC),
                created_by=created_by,
            )
            db.add(admin)
            db.flush()
            result.created_users.append(email)

        role = db.query(Role).filter(Role.name == user.role).first()
        if role is None:
            raise BootstrapError(f"Role {user.role} is missing from the catalogue")

        assignment = (
            db.query(AdministratorRole)
            .filter(
                AdministratorRole.administrator_id == admin.id,
                AdministratorRole.role_id == role.id,
            )
            .first()
        )
        if assignment is None:
            db.add(
                AdministratorRole(
                    administrator_id=admin.id,
                    role_id=role.id,
                    assigned_at=datetime.now(UTC),
                    assigned_by=created_by,
                )
            )
            result.assigned.append(f"{email}:{user.role}")
