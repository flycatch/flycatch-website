from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.public_solutions import PublicSolutionList
from flycatch_api.services.solution_service import SolutionService

router = APIRouter(prefix="/public/solutions", tags=["public-solutions"])
_solutions = SolutionService()


@router.get("", response_model=PublicSolutionList)
def list_public_solutions(db: Session = Depends(get_db)):
    return _solutions.list_published(db)
