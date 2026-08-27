from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.models import AdministratorRole, ManagedRecord, RecordType, Role, RolePermission
from flycatch_api.models.role_permission import PermissionName
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_roles import (
    RoleCatalogue,
    RoleConflict,
    RoleDetail,
    RoleList,
    RoleNotFound,
    RoleResource,
    RoleSummary,
    RoleWrite,
)

ACTIONS: tuple[str, ...] = ("create", "read", "update", "delete", "publish")
SYSTEM_ROLES = frozenset({"administrator", "editor"})
ROLE_ADMINISTRATOR = "administrator"
ROLE_EDITOR = "editor"
ROLES_MANAGE = PermissionName.roles_manage.value
# Matrix rows for Administration sections (order matches Roles UI / nav).
CONTENT_RESOURCES: tuple[RoleResource, ...] = (
    RoleResource(id="home", type="home", slug="default"),
    RoleResource(id="solutions", type="solutions", slug="default"),
    RoleResource(id="solution_details", type="solution_details", slug="default"),
    RoleResource(id="solution_products", type="solution_products", slug="default"),
    RoleResource(id="ai_services", type="ai_services", slug="default"),
    RoleResource(id="cloud_services", type="cloud_services", slug="default"),
    RoleResource(id="data_analytics", type="data_analytics", slug="default"),
    RoleResource(id="digital_transformation", type="digital_transformation", slug="default"),
    RoleResource(id="blogs", type="blogs", slug="default"),
    RoleResource(id="case_studies", type="case_studies", slug="default"),
    RoleResource(id="industries", type="industries", slug="default"),
    RoleResource(id="case_study_categories", type="case_study_categories", slug="default"),
    RoleResource(id="technologies", type="technologies", slug="default"),
    RoleResource(id="authors", type="authors", slug="default"),
    RoleResource(id="categories", type="categories", slug="default"),
    RoleResource(id="client_logos", type="client_logos", slug="default"),
    RoleResource(id="client_testimonials", type="client_testimonials", slug="default"),
)
DEFAULT_RESOURCES: tuple[RoleResource, ...] = (
    RoleResource(id="site_settings", type="site_settings", slug="default"),
    *CONTENT_RESOURCES,
    RoleResource(id="page.home", type="page", slug="home"),
)
PER_PAGE = 5
ROLE_DESCRIPTIONS = {
    ROLE_ADMINISTRATOR: "Full access to administration",
    ROLE_EDITOR: "Can view and edit drafts",
}


class RoleError(Exception):
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self.payload = payload
        super().__init__(payload.get("message_key", "role_error"))


def resource_id_for(record: ManagedRecord) -> str:
    record_type = record.type.value if isinstance(record.type, RecordType) else str(record.type)
    if record_type == RecordType.site_settings.value:
        return "site_settings"
    return f"{record_type}.{record.slug}"


def default_grants(role_name: str) -> list[str]:
    if role_name == ROLE_ADMINISTRATOR:
        grants = [f"{resource.id}.{action}" for resource in DEFAULT_RESOURCES for action in ACTIONS]
        grants.append(ROLES_MANAGE)
        grants.extend(
            [
                PermissionName.records_view.value,
                PermissionName.drafts_save.value,
                PermissionName.records_publish.value,
            ]
        )
        return grants
    grants = [
        f"{resource.id}.{action}"
        for resource in DEFAULT_RESOURCES
        for action in ("create", "read", "update", "delete")
    ]
    grants.extend([PermissionName.records_view.value, PermissionName.drafts_save.value])
    return grants


def sync_legacy(permissions: set[str]) -> set[str]:
    synced = set(permissions)
    if any(item.endswith(".read") for item in synced):
        synced.add(PermissionName.records_view.value)
    if any(
        item.endswith(suffix)
        for item in synced
        for suffix in (".create", ".update", ".delete")
    ):
        synced.add(PermissionName.drafts_save.value)
    if any(item.endswith(".publish") for item in synced):
        synced.add(PermissionName.records_publish.value)
    return synced


class RoleService:
    def catalogue(self, db: Session) -> RoleCatalogue:
        resources: list[RoleResource] = list(DEFAULT_RESOURCES)
        seen = {resource.id for resource in resources}
        records = db.query(ManagedRecord).order_by(ManagedRecord.type, ManagedRecord.slug).all()
        for record in records:
            identifier = resource_id_for(record)
            if identifier in seen:
                continue
            seen.add(identifier)
            record_type = (
                record.type.value if isinstance(record.type, RecordType) else str(record.type)
            )
            resources.append(RoleResource(id=identifier, type=record_type, slug=record.slug))
        return RoleCatalogue(actions=list(ACTIONS), resources=resources)

    def list_roles(self, db: Session, q: str | None, page: int, per_page: int) -> RoleList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(Role)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                Role.name.ilike(term) | func.coalesce(Role.description, "").ilike(term)
            )
        total = query.count()
        rows = (
            query.order_by(Role.name.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return RoleList(
            items=[self._summary(db, role) for role in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get(self, db: Session, role_id: UUID) -> RoleDetail:
        role = db.get(Role, role_id)
        if role is None:
            raise RoleError(404, RoleNotFound().model_dump())
        return self._detail(db, role)

    def create(self, db: Session, payload: RoleWrite) -> RoleDetail:
        name = payload.name.strip()
        self._validate_name(db, name, None)
        allowed = self._allowed_matrix(db)
        matrix = self._clean_matrix(payload.permissions, allowed)
        grants = sync_legacy(matrix)
        role = Role(
            name=name,
            description=self._description(payload.description),
            created_at=datetime.now(UTC),
        )
        db.add(role)
        db.flush()
        self._replace_permissions(db, role, grants)
        db.commit()
        db.refresh(role)
        return self._detail(db, role)

    def update(self, db: Session, role_id: UUID, payload: RoleWrite) -> RoleDetail:
        role = db.get(Role, role_id)
        if role is None:
            raise RoleError(404, RoleNotFound().model_dump())
        name = payload.name.strip()
        if self._is_system(role) and name.lower() != role.name.lower():
            raise RoleError(
                409,
                RoleConflict(
                    code="system_role", message_key="admin.roles.system_protected"
                ).model_dump(),
            )
        self._validate_name(db, name, role.id)
        allowed = self._allowed_matrix(db)
        matrix = self._clean_matrix(payload.permissions, allowed)
        grants = sync_legacy(matrix)
        if self._is_system(role) and role.name == ROLE_ADMINISTRATOR:
            grants.add(ROLES_MANAGE)
        if not self._is_system(role):
            role.name = name
        role.description = self._description(payload.description)
        self._replace_permissions(db, role, grants)
        db.commit()
        db.refresh(role)
        return self._detail(db, role)

    def delete(self, db: Session, role_id: UUID) -> None:
        role = db.get(Role, role_id)
        if role is None:
            raise RoleError(404, RoleNotFound().model_dump())
        if self._is_system(role):
            raise RoleError(
                409,
                RoleConflict(
                    code="system_role", message_key="admin.roles.system_protected"
                ).model_dump(),
            )
        user_count = self._user_count(db, role.id)
        if user_count > 0:
            raise RoleError(
                409,
                RoleConflict(code="role_in_use", message_key="admin.roles.in_use").model_dump(),
            )
        db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()
        db.delete(role)
        db.commit()

    def _allowed_matrix(self, db: Session) -> set[str]:
        catalogue = self.catalogue(db)
        return {f"{resource.id}.{action}" for resource in catalogue.resources for action in ACTIONS}

    def _clean_matrix(self, permissions: list[str], allowed: set[str]) -> set[str]:
        unknown = [item for item in permissions if item not in allowed]
        if unknown:
            raise RoleError(
                422,
                FieldErrors(
                    fields={
                        "permissions": FieldErrorDetail(
                            message_key="admin.roles.permissions.invalid"
                        )
                    }
                ).model_dump(),
            )
        return set(permissions)

    def _validate_name(self, db: Session, name: str, role_id: UUID | None) -> None:
        if not name:
            raise RoleError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        existing = db.query(Role).filter(func.lower(Role.name) == name.lower()).first()
        if existing is not None and existing.id != role_id:
            raise RoleError(
                422,
                FieldErrors(
                    fields={"name": FieldErrorDetail(message_key="admin.roles.name.duplicate")}
                ).model_dump(),
            )

    def _replace_permissions(self, db: Session, role: Role, grants: set[str]) -> None:
        db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()
        for permission in sorted(grants):
            db.add(RolePermission(role_id=role.id, permission=permission))
        db.flush()

    def _summary(self, db: Session, role: Role) -> RoleSummary:
        return RoleSummary(
            id=role.id,
            name=role.name,
            description=role.description,
            user_count=self._user_count(db, role.id),
            is_system=self._is_system(role),
        )

    def _detail(self, db: Session, role: Role) -> RoleDetail:
        permissions = sorted(
            grant.permission
            for grant in db.query(RolePermission).filter(RolePermission.role_id == role.id)
        )
        return RoleDetail(
            id=role.id,
            name=role.name,
            description=role.description,
            permissions=permissions,
            user_count=self._user_count(db, role.id),
            is_system=self._is_system(role),
        )

    def _user_count(self, db: Session, role_id: UUID) -> int:
        return (
            db.query(AdministratorRole)
            .filter(AdministratorRole.role_id == role_id)
            .count()
        )

    def _is_system(self, role: Role) -> bool:
        return role.name.lower() in SYSTEM_ROLES

    def _description(self, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None
