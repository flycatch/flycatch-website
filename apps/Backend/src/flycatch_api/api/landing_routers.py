from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.api.bulk_routes import attach_bulk_routes
from flycatch_api.db import get_db
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.landing_catalog import LandingCatalogService


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


def admin_landing_router(
    *,
    prefix: str,
    tags: str,
    resource: str,
    service: LandingCatalogService,
    list_model,
    detail_model,
    write_model,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tags])

    @router.get("", response_model=list_model, operation_id=f"list_{resource}")
    def list_entries(
        session: CurrentSession,
        db: Session = Depends(get_db),
        q: str | None = Query(default=None),
        page: int = Query(default=1, ge=1),
        per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
    ):
        assert_resource_action(db, session.administrator_id, resource, "read")
        return service.list_entries(db, q, page, per_page)

    @router.post(
        "",
        response_model=detail_model,
        status_code=status.HTTP_201_CREATED,
        operation_id=f"create_{resource}",
    )
    def create_entry(payload: write_model, session: CurrentSession, db: Session = Depends(get_db)):
        assert_write_permissions(
            db, session.administrator_id, resource, action="create", status_value=payload.status
        )
        try:
            return service.create(db, payload)
        except CatalogError as error:
            _raise(error)

    attach_bulk_routes(
        router,
        resource=resource,
        model=service.model,
        not_found_key=f"admin.{resource}.not_found",
    )

    @router.get("/{entry_id}", response_model=detail_model, operation_id=f"get_{resource}")
    def get_entry(entry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
        assert_resource_action(db, session.administrator_id, resource, "read")
        try:
            return service.get(db, entry_id)
        except CatalogError as error:
            _raise(error)

    @router.patch("/{entry_id}", response_model=detail_model, operation_id=f"update_{resource}")
    def update_entry(
        entry_id: UUID,
        payload: write_model,
        session: CurrentSession,
        db: Session = Depends(get_db),
    ):
        assert_write_permissions(
            db, session.administrator_id, resource, action="update", status_value=payload.status
        )
        try:
            return service.update(db, entry_id, payload)
        except CatalogError as error:
            _raise(error)

    @router.delete(
        "/{entry_id}",
        status_code=status.HTTP_204_NO_CONTENT,
        operation_id=f"delete_{resource}",
    )
    def delete_entry(entry_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
        assert_resource_action(db, session.administrator_id, resource, "delete")
        try:
            service.delete(db, entry_id)
        except CatalogError as error:
            _raise(error)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return router


def public_landing_router(
    *,
    prefix: str,
    tags: str,
    service: LandingCatalogService,
    list_model,
    detail_model,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tags])

    @router.get("", response_model=list_model, operation_id=f"list_public_{tags}")
    def list_published(
        db: Session = Depends(get_db),
        q: str | None = Query(default=None),
        page: int = Query(default=1, ge=1),
        per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
    ):
        return service.list_published(db, q, page, per_page)

    @router.get("/{slug}", response_model=detail_model, operation_id=f"get_public_{tags}")
    def get_published(slug: str, db: Session = Depends(get_db)):
        try:
            return service.get_published_by_slug(db, slug)
        except CatalogError as error:
            raise HTTPException(status_code=error.status_code, detail=error.payload) from error

    return router
