from collections.abc import Callable
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from flycatch_api.schemas.admin_blogs import EntityNotFound
from flycatch_api.services.author_service import CatalogError


def _not_found(message_key: str) -> CatalogError:
    return CatalogError(404, EntityNotFound(message_key=message_key).model_dump())


def load_rows(db: Session, model: type[Any], ids: list[UUID], not_found_key: str) -> list[Any]:
    unique_ids = list(dict.fromkeys(ids))
    rows = db.query(model).filter(model.id.in_(unique_ids)).all()
    found = {row.id: row for row in rows}
    ordered: list[Any] = []
    for item_id in unique_ids:
        row = found.get(item_id)
        if row is None:
            raise _not_found(not_found_key)
        ordered.append(row)
    return ordered


def bulk_unpublish(db: Session, model: type[Any], ids: list[UUID], not_found_key: str) -> int:
    rows = load_rows(db, model, ids, not_found_key)
    updated = 0
    for row in rows:
        status = getattr(row, "status", None)
        if status is None:
            continue
        value = getattr(status, "value", status)
        if str(value) != "publish":
            continue
        status_type = type(status)
        try:
            row.status = status_type("draft")
        except (TypeError, ValueError):
            row.status = "draft"
        updated += 1
    db.commit()
    return updated


def bulk_delete(
    db: Session,
    model: type[Any],
    ids: list[UUID],
    not_found_key: str,
    validate_row: Callable[[Session, Any], None] | None = None,
) -> int:
    rows = load_rows(db, model, ids, not_found_key)
    if validate_row is not None:
        for row in rows:
            validate_row(db, row)
    for row in rows:
        db.delete(row)
    db.commit()
    return len(rows)
