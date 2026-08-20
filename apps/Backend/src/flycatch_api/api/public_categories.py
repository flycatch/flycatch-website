from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_blogs import PublicCategoryList
from flycatch_api.services.category_service import CategoryService

router = APIRouter(prefix="/public/categories", tags=["public-categories"])
_categories = CategoryService()


@router.get("", response_model=PublicCategoryList)
def list_public_categories(db: Session = Depends(get_db)):
    return _categories.list_published(db)
