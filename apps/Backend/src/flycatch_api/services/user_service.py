from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.models import Administrator, AdministratorRole, AdminSession, Role
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_users import (
    UserBulkAssign,
    UserBulkAssignResult,
    UserConflict,
    UserCreate,
    UserList,
    UserNotFound,
    UserRole,
    UserSummary,
    UserUpdate,
)
from flycatch_api.services.microsoft_auth import company_email
from flycatch_api.services.role_service import ROLE_ADMINISTRATOR, RoleError

PER_PAGE = 20
MAX_PER_PAGE = 100


class UserError(Exception):
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self.payload = payload
        super().__init__(payload.get("message_key", "user_error"))


def _field_error(field: str, message_key: str) -> UserError:
    return UserError(
        422, FieldErrors(fields={field: FieldErrorDetail(message_key=message_key)}).model_dump()
    )


def _conflict(code: str, message_key: str) -> UserError:
    return UserError(409, UserConflict(code=code, message_key=message_key).model_dump())


class UserService:
    def list_users(
        self,
        db: Session,
        q: str | None,
        page: int,
        per_page: int,
        role_id: UUID | None,
        status: str | None,
    ) -> UserList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), MAX_PER_PAGE)
        query = db.query(Administrator)
        if q and q.strip():
            query = query.filter(Administrator.email.ilike(f"%{q.strip()}%"))
        if status == "active":
            query = query.filter(Administrator.is_active.is_(True))
        elif status == "inactive":
            query = query.filter(Administrator.is_active.is_(False))
        if role_id is not None:
            query = query.filter(
                Administrator.id.in_(
                    db.query(AdministratorRole.administrator_id).filter(
                        AdministratorRole.role_id == role_id
                    )
                )
            )
        total = query.count()
        rows = (
            query.order_by(Administrator.email.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return UserList(
            items=[self._summary(db, row) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get(self, db: Session, user_id: UUID) -> UserSummary:
        return self._summary(db, self._load(db, user_id))

    def create(self, db: Session, payload: UserCreate, actor_email: str) -> UserSummary:
        email = company_email(payload.email)
        if email is None:
            raise _field_error("email", "admin.users.email.invalid_domain")
        exists = db.query(Administrator).filter(func.lower(Administrator.email) == email).first()
        if exists is not None:
            raise _field_error("email", "admin.users.email.duplicate")
        roles = self._roles(db, payload.role_ids)
        user = Administrator(
            email=email,
            password_hash=None,
            microsoft_oid=None,
            is_active=True,
            created_at=datetime.now(UTC),
            created_by=actor_email,
        )
        db.add(user)
        db.flush()
        self._set_roles(db, user, roles, actor_email)
        db.commit()
        db.refresh(user)
        return self._summary(db, user)

    def update(
        self, db: Session, user_id: UUID, payload: UserUpdate, actor_id: UUID, actor_email: str
    ) -> UserSummary:
        user = self._load(db, user_id)
        if payload.is_active is False and user.id == actor_id:
            raise _conflict("self_protected", "admin.users.self_protected")
        if payload.role_ids is not None:
            roles = self._roles(db, payload.role_ids)
            if user.id == actor_id and not any(r.name == ROLE_ADMINISTRATOR for r in roles):
                if self._has_role(db, user.id, ROLE_ADMINISTRATOR):
                    raise _conflict("self_protected", "admin.users.self_protected")
            self._set_roles(db, user, roles, actor_email)
        if payload.is_active is not None and payload.is_active != user.is_active:
            user.is_active = payload.is_active
            if not payload.is_active:
                self._revoke_sessions(db, user.id)
        self._ensure_administrator_remains(db)
        db.commit()
        db.refresh(user)
        return self._summary(db, user)

    def bulk_assign(
        self, db: Session, payload: UserBulkAssign, actor_id: UUID, actor_email: str
    ) -> UserBulkAssignResult:
        role = db.get(Role, payload.role_id)
        if role is None:
            raise RoleError(404, {"code": "not_found", "message_key": "admin.roles.not_found"})
        user_ids = set(payload.user_ids)
        users = db.query(Administrator).filter(Administrator.id.in_(user_ids)).all()
        if len(users) != len(user_ids):
            raise UserError(404, UserNotFound().model_dump())
        changed = 0
        for user in users:
            link = db.get(AdministratorRole, (user.id, role.id))
            if payload.action == "add" and link is None:
                db.add(
                    AdministratorRole(
                        administrator_id=user.id,
                        role_id=role.id,
                        assigned_at=datetime.now(UTC),
                        assigned_by=actor_email,
                    )
                )
                changed += 1
            elif payload.action == "remove" and link is not None:
                if user.id == actor_id and role.name == ROLE_ADMINISTRATOR:
                    raise _conflict("self_protected", "admin.users.self_protected")
                db.delete(link)
                changed += 1
        db.flush()
        self._ensure_administrator_remains(db)
        db.commit()
        return UserBulkAssignResult(changed=changed)

    def role_users(self, db: Session, role_id: UUID) -> list[UserSummary]:
        if db.get(Role, role_id) is None:
            raise RoleError(404, {"code": "not_found", "message_key": "admin.roles.not_found"})
        rows = (
            db.query(Administrator)
            .join(AdministratorRole, AdministratorRole.administrator_id == Administrator.id)
            .filter(AdministratorRole.role_id == role_id)
            .order_by(Administrator.email.asc())
            .all()
        )
        return [self._summary(db, row) for row in rows]

    def _load(self, db: Session, user_id: UUID) -> Administrator:
        user = db.get(Administrator, user_id)
        if user is None:
            raise UserError(404, UserNotFound().model_dump())
        return user

    def _roles(self, db: Session, role_ids: list[UUID]) -> list[Role]:
        unique = set(role_ids)
        roles = db.query(Role).filter(Role.id.in_(unique)).all() if unique else []
        if len(roles) != len(unique):
            raise _field_error("role_ids", "admin.users.roles.invalid")
        return roles

    def _set_roles(
        self, db: Session, user: Administrator, roles: list[Role], actor_email: str
    ) -> None:
        wanted = {role.id for role in roles}
        current = db.query(AdministratorRole).filter(AdministratorRole.administrator_id == user.id)
        existing = {link.role_id: link for link in current}
        for role_id, link in existing.items():
            if role_id not in wanted:
                db.delete(link)
        for role_id in wanted - existing.keys():
            db.add(
                AdministratorRole(
                    administrator_id=user.id,
                    role_id=role_id,
                    assigned_at=datetime.now(UTC),
                    assigned_by=actor_email,
                )
            )
        db.flush()

    def _has_role(self, db: Session, user_id: UUID, role_name: str) -> bool:
        return (
            db.query(AdministratorRole)
            .join(Role, Role.id == AdministratorRole.role_id)
            .filter(AdministratorRole.administrator_id == user_id, Role.name == role_name)
            .first()
            is not None
        )

    def _ensure_administrator_remains(self, db: Session) -> None:
        remaining = (
            db.query(Administrator)
            .join(AdministratorRole, AdministratorRole.administrator_id == Administrator.id)
            .join(Role, Role.id == AdministratorRole.role_id)
            .filter(Administrator.is_active.is_(True), Role.name == ROLE_ADMINISTRATOR)
            .count()
        )
        if remaining == 0:
            db.rollback()
            raise _conflict("last_administrator", "admin.users.last_administrator")

    def _revoke_sessions(self, db: Session, user_id: UUID) -> None:
        now = datetime.now(UTC)
        db.query(AdminSession).filter(
            AdminSession.administrator_id == user_id, AdminSession.revoked_at.is_(None)
        ).update({AdminSession.revoked_at: now})

    def _summary(self, db: Session, user: Administrator) -> UserSummary:
        roles = (
            db.query(Role)
            .join(AdministratorRole, AdministratorRole.role_id == Role.id)
            .filter(AdministratorRole.administrator_id == user.id)
            .order_by(Role.name.asc())
            .all()
        )
        return UserSummary(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            roles=[UserRole(id=role.id, name=role.name) for role in roles],
            created_by=user.created_by,
            created_at=user.created_at,
        )
