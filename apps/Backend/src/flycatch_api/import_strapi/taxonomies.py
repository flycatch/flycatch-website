from __future__ import annotations

import logging
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from flycatch_api.import_strapi.client import relation_list, relation_one
from flycatch_api.import_strapi.context import ImportContext, ImportStats
from flycatch_api.import_strapi.populate import POPULATE
from flycatch_api.import_strapi.status import (
    as_text,
    content_status,
    ensure_slug,
    parse_datetime,
    truncate,
)
from flycatch_api.models.author import Author
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.case_study_category import CaseStudyCategory
from flycatch_api.models.catalog import NewsCategory, ResourceCategory
from flycatch_api.models.category import Category
from flycatch_api.models.industry import Industry
from flycatch_api.models.technology import Technology

logger = logging.getLogger(__name__)


def _upsert_named(
    ctx: ImportContext,
    *,
    model: type,
    collection: str,
    name_field: str = "name",
    name: str,
    strapi_id: int | None,
    status: ContentStatus,
    created_at: datetime,
    extra: dict | None = None,
) -> None:
    name = truncate(name, 120)
    if not name:
        ctx.stats.skipped += 1
        return
    existing = ctx.db.query(model).filter(getattr(model, name_field) == name).first()
    if ctx.dry_run:
        if existing:
            ctx.id_map.set(collection, strapi_id, existing.id)
            ctx.stats.updated += 1
        else:
            ctx.id_map.set(collection, strapi_id, uuid4())
            ctx.stats.created += 1
        return
    if existing:
        existing.status = status
        if extra:
            for key, value in extra.items():
                setattr(existing, key, value)
        ctx.id_map.set(collection, strapi_id, existing.id)
        ctx.stats.updated += 1
        return
    row = model(
        id=uuid4(),
        **{name_field: name},
        status=status,
        created_at=created_at,
        **(extra or {}),
    )
    ctx.db.add(row)
    ctx.db.flush()
    ctx.id_map.set(collection, strapi_id, row.id)
    ctx.stats.created += 1


def import_categories(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("categories", populate=POPULATE["categories"]):
            _upsert_named(
                ctx,
                model=Category,
                collection="categories",
                name=as_text(entity.get("name")),
                strapi_id=entity.get("id"),
                status=content_status(entity),
                created_at=parse_datetime(entity.get("createdAt")),
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("categories", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_case_study_categories(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "contenttype-categories", populate=POPULATE["contenttype-categories"]
        ):
            name = as_text(entity.get("Name") or entity.get("name"))
            _upsert_named(
                ctx,
                model=CaseStudyCategory,
                collection="contenttype-categories",
                name=name,
                strapi_id=entity.get("id"),
                status=content_status(entity),
                created_at=parse_datetime(entity.get("createdAt")),
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("contenttype-categories", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_industries(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("industries", populate=POPULATE["industries"]):
            name = as_text(entity.get("Name") or entity.get("name"))
            _upsert_named(
                ctx,
                model=Industry,
                collection="industries",
                name=name,
                strapi_id=entity.get("id"),
                status=content_status(entity),
                created_at=parse_datetime(entity.get("createdAt")),
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("industries", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_technologies(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        entities = ctx.client.list_all("technologies", populate=POPULATE["technologies"])
    except Exception as exc:  # noqa: BLE001
        logger.info("technologies collection unavailable (%s); will extract from case studies", exc)
        before.merge(local)
        ctx.stats = before
        return local
    try:
        for entity in entities:
            logo_key = ctx.media.import_field(entity.get("logo"))
            _upsert_named(
                ctx,
                model=Technology,
                collection="technologies",
                name=as_text(entity.get("name") or entity.get("Name")),
                strapi_id=entity.get("id"),
                status=content_status(entity),
                created_at=parse_datetime(entity.get("createdAt")),
                extra={"logo_key": logo_key},
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("technologies", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_news_categories(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("news-categories", populate=POPULATE["news-categories"]):
            _upsert_named(
                ctx,
                model=NewsCategory,
                collection="news-categories",
                name=as_text(entity.get("name") or entity.get("username")),
                strapi_id=entity.get("id"),
                status=content_status(entity),
                created_at=parse_datetime(entity.get("createdAt")),
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("news-categories", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_resource_categories(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "resource-categories", populate=POPULATE["resource-categories"]
        ):
            _upsert_named(
                ctx,
                model=ResourceCategory,
                collection="resource-categories",
                name=as_text(entity.get("name")),
                strapi_id=entity.get("id"),
                status=content_status(entity),
                created_at=parse_datetime(entity.get("createdAt")),
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("resource-categories", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def ensure_author(
    ctx: ImportContext,
    *,
    name: str,
    bio: str = "",
    designation: str = "",
    image_keys: list[str] | None = None,
    status: ContentStatus = ContentStatus.publish,
    strapi_id: int | None = None,
) -> Author | None:
    name = truncate(name, 120)
    if not name:
        return None
    existing = ctx.db.query(Author).filter(Author.name == name).first()
    if ctx.dry_run:
        if existing:
            ctx.id_map.set("authors", strapi_id, existing.id)
            return existing
        fake = Author(
            id=uuid4(),
            name=name,
            bio=bio,
            designation=designation,
            writer_image_keys=image_keys or [],
            status=status,
            created_at=datetime.now(UTC),
        )
        ctx.id_map.set("authors", strapi_id, fake.id)
        return fake
    if existing:
        if bio:
            existing.bio = bio
        if designation:
            existing.designation = designation
        if image_keys:
            existing.writer_image_keys = image_keys
        existing.status = status
        ctx.id_map.set("authors", strapi_id, existing.id)
        return existing
    row = Author(
        id=uuid4(),
        name=name,
        bio=bio or "",
        designation=designation or "",
        writer_image_keys=image_keys or [],
        status=status,
        created_at=datetime.now(UTC),
    )
    ctx.db.add(row)
    ctx.db.flush()
    ctx.id_map.set("authors", strapi_id, row.id)
    return row


def import_authors_from_blogs(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    seen: set[str] = set()
    try:
        for entity in ctx.client.list_all("blogs", populate=POPULATE["blogs"]):
            author = relation_one(entity.get("author"))
            writer_images = ctx.media.import_many(entity.get("writer_image"))
            name = ""
            strapi_id = None
            if author:
                name = as_text(author.get("username") or author.get("name") or author.get("email"))
                strapi_id = author.get("id")
            if not name:
                name = as_text(entity.get("author_name"))
            name = truncate(name, 120)
            if not name or name in seen:
                continue
            seen.add(name)
            prior = ctx.db.query(Author).filter(Author.name == name).first()
            row = ensure_author(
                ctx,
                name=name,
                image_keys=writer_images,
                status=ContentStatus.publish,
                strapi_id=strapi_id,
            )
            if row is None:
                local.skipped += 1
            elif prior is None:
                local.created += 1
            else:
                local.updated += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("authors", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def ensure_technology_named(
    ctx: ImportContext, *, name: str, logo_key: str | None, strapi_id: int | None
) -> Technology | None:
    name = truncate(name, 120)
    if not name:
        return None
    existing = ctx.db.query(Technology).filter(Technology.name == name).first()
    if ctx.dry_run:
        if existing:
            ctx.id_map.set("technologies", strapi_id, existing.id)
            return existing
        fake = Technology(
            id=uuid4(),
            name=name,
            logo_key=logo_key,
            status=ContentStatus.publish,
            created_at=datetime.now(UTC),
        )
        ctx.id_map.set("technologies", strapi_id, fake.id)
        return fake
    if existing:
        if logo_key:
            existing.logo_key = logo_key
        existing.status = ContentStatus.publish
        ctx.id_map.set("technologies", strapi_id, existing.id)
        return existing
    row = Technology(
        id=uuid4(),
        name=name,
        logo_key=logo_key,
        status=ContentStatus.publish,
        created_at=datetime.now(UTC),
    )
    ctx.db.add(row)
    ctx.db.flush()
    ctx.id_map.set("technologies", strapi_id, row.id)
    return row


def resolve_category_ids(ctx: ImportContext, value, *, collection: str, model: type) -> list:
    ids = []
    for rel in relation_list(value):
        mapped = ctx.id_map.get(collection, rel.get("id"))
        if mapped:
            ids.append(mapped)
            continue
        name = as_text(rel.get("name") or rel.get("Name") or rel.get("username"))
        if not name:
            continue
        row = ctx.db.query(model).filter(model.name == name).first()
        if row:
            ids.append(row.id)
            ctx.id_map.set(collection, rel.get("id"), row.id)
    return ids


def unique_slug(db: Session, model: type, slug: str, *, exclude_id=None) -> str:
    base = ensure_slug(slug, "item")
    candidate = base
    n = 2
    while True:
        query = db.query(model).filter(model.slug == candidate)
        if exclude_id is not None:
            query = query.filter(model.id != exclude_id)
        if query.first() is None:
            return candidate
        candidate = truncate(f"{base}-{n}", 128)
        n += 1
