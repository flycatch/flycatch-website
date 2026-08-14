from datetime import UTC, datetime

from flycatch_api.db import SessionLocal
from flycatch_api.models import ManagedRecord, RecordType
from flycatch_api.services.record_service import RecordService

SITE_SETTINGS = {
    "site_name": "Flycatch",
    "default_locale": "en",
    "locale_url_strategy": "unprefixed_default",
    "robots_policy": "index_public",
    "default_social_image_key": None,
    "canonical_origin": "http://localhost:8080",
}

HOME_PAGE = {
    "slug": "home",
    "seo": {
        "title": "Flycatch — Foundation",
        "description": "Production-ready SEO-first website foundation placeholder.",
        "canonical_path": "/",
        "indexable": True,
        "social_title": "Flycatch — Foundation",
        "social_description": "Production-ready SEO-first website foundation placeholder.",
        "social_image_key": None,
        "primary_heading": "Flycatch Foundation",
        "summary": "Foundation placeholder for the public website.",
        "structured_data_templates": ["organization", "web_page"],
    },
    "body": "This is the foundation home page. Content is bound at build time from the published snapshot.",
    "message_keys": {"summary": "page.home.summary", "body": "page.home.body"},
}


def main() -> None:
    db = SessionLocal()
    try:
        now = datetime.now(UTC)
        for record_type, slug, payload in [
            (RecordType.site_settings, "default", SITE_SETTINGS),
            (RecordType.page, "home", HOME_PAGE),
        ]:
            existing = (
                db.query(ManagedRecord)
                .filter(ManagedRecord.type == record_type, ManagedRecord.slug == slug)
                .first()
            )
            if existing:
                continue
            record = ManagedRecord(
                type=record_type,
                slug=slug,
                draft_payload=payload,
                published_payload=payload,
                draft_updated_at=now,
                draft_updated_by=None,
                published_at=now,
                published_by=None,
            )
            db.add(record)
        db.commit()
        print("Seeded managed records")
    finally:
        db.close()


if __name__ == "__main__":
    main()
