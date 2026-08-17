from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas import ManagedPage, ManagedSiteSettings, PageContent, SiteSettings
from flycatch_api.security.dependencies import RequireDraft, RequireView
from flycatch_api.services.record_service import RecordService

router = APIRouter(prefix="/admin", tags=["admin-management"])
_records = RecordService()


@router.get("/site-settings", response_model=ManagedSiteSettings)
def get_site_settings_record(_session: RequireView, db: Session = Depends(get_db)):
    record = _records.get_site_settings(db)
    return _records._to_managed_site_settings(record)


@router.patch("/site-settings", response_model=ManagedSiteSettings)
def save_site_settings_draft(
    payload: SiteSettings,
    session: RequireDraft,
    db: Session = Depends(get_db),
):
    return _records.save_site_settings_draft(db, payload, session.administrator_id)


@router.get("/pages/{slug}", response_model=ManagedPage)
def get_page_record(slug: str, _session: RequireView, db: Session = Depends(get_db)):
    record = _records.get_page(db, slug)
    return _records._to_managed_page(record)


@router.patch("/pages/{slug}", response_model=ManagedPage)
def save_page_draft(
    slug: str,
    payload: PageContent,
    session: RequireDraft,
    db: Session = Depends(get_db),
):
    return _records.save_page_draft(db, slug, payload, session.administrator_id)
