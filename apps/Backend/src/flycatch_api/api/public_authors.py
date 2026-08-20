from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_blogs import PublicAuthorList
from flycatch_api.services.author_service import AuthorService

router = APIRouter(prefix="/public/authors", tags=["public-authors"])
_authors = AuthorService()


@router.get("", response_model=PublicAuthorList)
def list_public_authors(db: Session = Depends(get_db)):
    return _authors.list_published(db)
