from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_client_testimonials import (
    ClientTestimonial,
    ClientTestimonialList,
    ClientTestimonialWrite,
)
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.client_testimonial_service import ClientTestimonialService
from flycatch_api.services.industry_service import PER_PAGE

router = APIRouter(prefix="/admin/client-testimonials", tags=["admin-client-testimonials"])
_testimonials = ClientTestimonialService()
RESOURCE = "client_testimonials"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=ClientTestimonialList)
def list_client_testimonials(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _testimonials.list_testimonials(db, q, page, per_page)


@router.post("", response_model=ClientTestimonial, status_code=status.HTTP_201_CREATED)
def create_client_testimonial(
    payload: ClientTestimonialWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _testimonials.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{testimonial_id}", response_model=ClientTestimonial)
def get_client_testimonial(
    testimonial_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _testimonials.get(db, testimonial_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{testimonial_id}", response_model=ClientTestimonial)
def update_client_testimonial(
    testimonial_id: UUID,
    payload: ClientTestimonialWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _testimonials.update(db, testimonial_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_testimonial(
    testimonial_id: UUID, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _testimonials.delete(db, testimonial_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
