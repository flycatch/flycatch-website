from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_blogs import Author, AuthorList, AuthorWrite
from flycatch_api.security.dependencies import RequireDraft, RequireView
from flycatch_api.services.author_service import AuthorService, CatalogError

router = APIRouter(prefix="/admin/authors", tags=["admin-authors"])
_authors = AuthorService()


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=AuthorList)
def list_authors(_session: RequireView, db: Session = Depends(get_db)):
    return _authors.list_authors(db)


@router.post("", response_model=Author, status_code=status.HTTP_201_CREATED)
def create_author(payload: AuthorWrite, _session: RequireDraft, db: Session = Depends(get_db)):
    try:
        return _authors.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{author_id}", response_model=Author)
def get_author(author_id: UUID, _session: RequireView, db: Session = Depends(get_db)):
    try:
        return _authors.get(db, author_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{author_id}", response_model=Author)
def update_author(
    author_id: UUID, payload: AuthorWrite, _session: RequireDraft, db: Session = Depends(get_db)
):
    try:
        return _authors.update(db, author_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author(author_id: UUID, _session: RequireDraft, db: Session = Depends(get_db)):
    try:
        _authors.delete(db, author_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
