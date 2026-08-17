from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from flycatch_api.config import settings
from flycatch_api.db import get_db
from flycatch_api.models import RecordType
from flycatch_api.schemas import PublishRequest, PublishResult, PublishedSnapshot
from flycatch_api.security.dependencies import RequirePublish
from flycatch_api.services.publish_export import PublishExportService
from flycatch_api.services.record_service import RecordService

router = APIRouter(tags=["publish"])
_records = RecordService()
_export = PublishExportService()


@router.post("/admin/publish", response_model=PublishResult)
def publish_record(
    payload: PublishRequest,
    session: RequirePublish,
    db: Session = Depends(get_db),
):
    record_type = RecordType(payload.type)
    record = _records.publish_record(db, record_type, payload.slug, session.administrator_id)
    snapshot = _export.export_snapshot(db)
    return PublishResult(
        type=payload.type,
        slug=payload.slug,
        published_at=record.published_at,
        snapshot_revision=snapshot.revision,
    )


@router.get("/published/snapshot", response_model=PublishedSnapshot)
def get_published_snapshot(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    if settings.environment != "local":
        token = (authorization or "").removeprefix("Bearer ").strip()
        if token != settings.build_export_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    try:
        return _export.build_snapshot(db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
