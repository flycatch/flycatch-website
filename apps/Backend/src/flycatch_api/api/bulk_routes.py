from collections.abc import Callable
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.models import BlogAuthor, RolePermission
from flycatch_api.models.catalog import NewsAuthorLink
from flycatch_api.models.category import BlogCategory
from flycatch_api.models.role_permission import PermissionName
from flycatch_api.schemas.admin_blogs import EntityInUse
from flycatch_api.schemas.admin_bulk import BulkActionResult, BulkIds
from flycatch_api.schemas.admin_roles import RoleConflict
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_permission,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.bulk_service import bulk_delete, bulk_unpublish
from flycatch_api.services.role_service import RoleError, RoleService


def _raise(error: CatalogError | RoleError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


def author_delete_guard(db: Session, row: Any) -> None:
    in_use = (
        db.query(BlogAuthor).filter(BlogAuthor.author_id == row.id).count()
        + db.query(NewsAuthorLink).filter(NewsAuthorLink.author_id == row.id).count()
    )
    if in_use:
        raise CatalogError(409, EntityInUse(message_key="admin.authors.in_use").model_dump())


def category_delete_guard(db: Session, row: Any) -> None:
    in_use = db.query(BlogCategory).filter(BlogCategory.category_id == row.id).count()
    if in_use:
        raise CatalogError(409, EntityInUse(message_key="admin.categories.in_use").model_dump())


def role_delete_guard(db: Session, row: Any) -> None:
    roles = RoleService()
    if roles._is_system(row):
        raise RoleError(
            409,
            RoleConflict(
                code="system_role", message_key="admin.roles.system_protected"
            ).model_dump(),
        )
    if roles._user_count(db, row.id) > 0:
        raise RoleError(
            409,
            RoleConflict(code="role_in_use", message_key="admin.roles.in_use").model_dump(),
        )
    db.query(RolePermission).filter(RolePermission.role_id == row.id).delete()


def attach_bulk_routes(
    router: APIRouter,
    *,
    resource: str,
    model: type[Any],
    not_found_key: str | None = None,
    supports_unpublish: bool = True,
    auth: Literal["resource", "roles"] = "resource",
    validate_delete: Callable[[Session, Any], None] | None = None,
) -> None:
    missing_key = not_found_key or f"admin.{resource}.not_found"

    if supports_unpublish:

        @router.post(
            "/bulk-unpublish",
            response_model=BulkActionResult,
            operation_id=f"bulk_unpublish_{resource}",
        )
        def bulk_unpublish_items(
            payload: BulkIds,
            session: CurrentSession,
            db: Session = Depends(get_db),
        ):
            if auth == "roles":
                assert_permission(db, session.administrator_id, PermissionName.roles_manage)
            else:
                assert_write_permissions(
                    db, session.administrator_id, resource, action="update", status_value="draft"
                )
            try:
                count = bulk_unpublish(db, model, payload.ids, missing_key)
            except CatalogError as error:
                _raise(error)
            return BulkActionResult(count=count)

    @router.post(
        "/bulk-delete",
        response_model=BulkActionResult,
        operation_id=f"bulk_delete_{resource}",
    )
    def bulk_delete_items(
        payload: BulkIds,
        session: CurrentSession,
        db: Session = Depends(get_db),
    ):
        if auth == "roles":
            assert_permission(db, session.administrator_id, PermissionName.roles_manage)
        else:
            assert_resource_action(db, session.administrator_id, resource, "delete")
        try:
            count = bulk_delete(db, model, payload.ids, missing_key, validate_delete)
        except (CatalogError, RoleError) as error:
            _raise(error)
        return BulkActionResult(count=count)
