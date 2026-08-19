from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_blogs import BlogDetail, BlogList, BlogWrite
from flycatch_api.security.dependencies import RequireDraft, RequireView
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.blog_service import PER_PAGE, BlogService

router = APIRouter(prefix="/admin/blogs", tags=["admin-blogs"])
_blogs = BlogService()


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=BlogList)
def list_blogs(
    _session: RequireView,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _blogs.list_blogs(db, q, page, per_page)


@router.post("", response_model=BlogDetail, status_code=status.HTTP_201_CREATED)
def create_blog(payload: BlogWrite, _session: RequireDraft, db: Session = Depends(get_db)):
    try:
        return _blogs.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{blog_id}", response_model=BlogDetail)
def get_blog(blog_id: UUID, _session: RequireView, db: Session = Depends(get_db)):
    try:
        return _blogs.get(db, blog_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{blog_id}", response_model=BlogDetail)
def update_blog(
    blog_id: UUID, payload: BlogWrite, _session: RequireDraft, db: Session = Depends(get_db)
):
    try:
        return _blogs.update(db, blog_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(blog_id: UUID, _session: RequireDraft, db: Session = Depends(get_db)):
    try:
        _blogs.delete(db, blog_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
