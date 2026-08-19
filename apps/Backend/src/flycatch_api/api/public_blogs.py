from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_blogs import PublicBlogDetail, PublicBlogList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.blog_service import PER_PAGE, BlogService

router = APIRouter(prefix="/public/blogs", tags=["public-blogs"])
_blogs = BlogService()


@router.get("", response_model=PublicBlogList)
def list_public_blogs(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    return _blogs.list_published(db, q, page, per_page)


@router.get("/{slug}", response_model=PublicBlogDetail)
def get_public_blog(slug: str, db: Session = Depends(get_db)):
    try:
        return _blogs.get_published_by_slug(db, slug)
    except CatalogError as error:
        raise HTTPException(status_code=error.status_code, detail=error.payload) from error
