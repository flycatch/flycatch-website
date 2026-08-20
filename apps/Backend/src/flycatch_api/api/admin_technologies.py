from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_case_studies import Technology, TechnologyList, TechnologyWrite
from flycatch_api.security.dependencies import RequireDraft, RequireView
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.technology_service import TechnologyService

router = APIRouter(prefix="/admin/technologies", tags=["admin-technologies"])
_technologies = TechnologyService()


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=TechnologyList)
def list_technologies(
    _session: RequireView,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _technologies.list_technologies(db, q, page, per_page)


@router.post("", response_model=Technology, status_code=status.HTTP_201_CREATED)
def create_technology(
    payload: TechnologyWrite, _session: RequireDraft, db: Session = Depends(get_db)
):
    try:
        return _technologies.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{technology_id}", response_model=Technology)
def get_technology(technology_id: UUID, _session: RequireView, db: Session = Depends(get_db)):
    try:
        return _technologies.get(db, technology_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{technology_id}", response_model=Technology)
def update_technology(
    technology_id: UUID,
    payload: TechnologyWrite,
    _session: RequireDraft,
    db: Session = Depends(get_db),
):
    try:
        return _technologies.update(db, technology_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{technology_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_technology(
    technology_id: UUID, _session: RequireDraft, db: Session = Depends(get_db)
):
    try:
        _technologies.delete(db, technology_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
