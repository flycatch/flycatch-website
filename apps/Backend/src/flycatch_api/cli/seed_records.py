import uuid
from datetime import UTC, datetime

from flycatch_api.db import SessionLocal
from flycatch_api.models import Administrator, ManagedRecord, RecordType

SYSTEM_ACTOR = uuid.UUID("00000000-0000-0000-0000-000000000001")

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

ABOUT_PAGE = {
    "slug": "about",
    "seo": {
        "title": "About Flycatch",
        "description": "About this foundation site.",
        "canonical_path": "/about",
        "indexable": True,
        "social_title": "About Flycatch",
        "social_description": "About this foundation site.",
        "social_image_key": None,
        "primary_heading": "About",
        "summary": "About this foundation site.",
        "structured_data_templates": ["organization", "web_page"],
    },
    "body": "This placeholder route demonstrates repeatable scaffolding conventions.",
    "message_keys": {"summary": "page.about.summary", "body": "page.about.body"},
}


def _attribution_actor(db) -> uuid.UUID:
    admin = db.query(Administrator).order_by(Administrator.created_at).first()
    return admin.id if admin else SYSTEM_ACTOR


def main() -> None:
    db = SessionLocal()
    try:
        now = datetime.now(UTC)
        actor = _attribution_actor(db)
        created = 0
        repaired = 0
        for record_type, slug, payload in [
            (RecordType.site_settings, "default", SITE_SETTINGS),
            (RecordType.page, "home", HOME_PAGE),
            (RecordType.page, "about", ABOUT_PAGE),
        ]:
            existing = (
                db.query(ManagedRecord)
                .filter(ManagedRecord.type == record_type, ManagedRecord.slug == slug)
                .first()
            )
            if existing:
                if existing.draft_updated_by is None:
                    existing.draft_updated_at = existing.draft_updated_at or now
                    existing.draft_updated_by = actor
                    existing.published_at = existing.published_at or now
                    existing.published_by = existing.published_by or actor
                    repaired += 1
                continue
            record = ManagedRecord(
                type=record_type,
                slug=slug,
                draft_payload=payload,
                published_payload=payload,
                draft_updated_at=now,
                draft_updated_by=actor,
                published_at=now,
                published_by=actor,
            )
            db.add(record)
            created += 1
        db.commit()
        if created or repaired:
            print(f"Seeded managed records (created={created}, repaired={repaired})")
        else:
            print("Managed records already exist")
    finally:
        db.close()


if __name__ == "__main__":
    main()
