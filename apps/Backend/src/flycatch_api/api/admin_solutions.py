from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas.admin_solutions import Solution, SolutionList, SolutionWrite
from flycatch_api.security.dependencies import (
    CurrentSession,
    assert_resource_action,
    assert_write_permissions,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE
from flycatch_api.services.solution_service import SolutionService

router = APIRouter(prefix="/admin/solutions", tags=["admin-solutions"])
_solutions = SolutionService()
RESOURCE = "solutions"


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


@router.get("", response_model=SolutionList)
def list_solutions(
    session: CurrentSession,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    return _solutions.list_solutions(db, q, page, per_page)


@router.post("", response_model=Solution, status_code=status.HTTP_201_CREATED)
def create_solution(payload: SolutionWrite, session: CurrentSession, db: Session = Depends(get_db)):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="create", status_value=payload.status
    )
    try:
        return _solutions.create(db, payload)
    except CatalogError as error:
        _raise(error)


@router.get("/{solution_id}", response_model=Solution)
def get_solution(solution_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "read")
    try:
        return _solutions.get(db, solution_id)
    except CatalogError as error:
        _raise(error)


@router.patch("/{solution_id}", response_model=Solution)
def update_solution(
    solution_id: UUID,
    payload: SolutionWrite,
    session: CurrentSession,
    db: Session = Depends(get_db),
):
    assert_write_permissions(
        db, session.administrator_id, RESOURCE, action="update", status_value=payload.status
    )
    try:
        return _solutions.update(db, solution_id, payload)
    except CatalogError as error:
        _raise(error)


@router.delete("/{solution_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_solution(solution_id: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, RESOURCE, "delete")
    try:
        _solutions.delete(db, solution_id)
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
