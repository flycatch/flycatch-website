from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_blogs import Author, AuthorList, AuthorWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import AuthorService, CatalogError

router = APIRouter(prefix="/admin/authors", tags=["admin-authors"])
_authors = AuthorService()
RESOURCE = "authors"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=AuthorList)
def list_authors(session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _authors.list_authors(db)


@router.post("", response_model=Author, status_code=status.HTTP_201_CREATED)
def create_author(payload: AuthorWrite, session: CurrentSession, db: Session = Depends(get_db)):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _authors.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{author_id}", response_model=Author)
def get_author(author_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _authors.get(db, author_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{author_id}", response_model=Author)
def update_author(
    author_id: UUID, payload: AuthorWrite, session: CurrentSession, db: Session = Depends(get_db)
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _authors.update(db, author_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author(author_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _authors.delete(db, author_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
