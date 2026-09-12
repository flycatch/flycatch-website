from __future__ import annotations

from uuid import uuid4

from flycatch_api.import_strapi.client import relation_list, relation_one
from flycatch_api.import_strapi.context import ImportContext, ImportStats
from flycatch_api.import_strapi.populate import POPULATE
from flycatch_api.import_strapi.status import (
    as_int,
    as_text,
    blog_status,
    content_status,
    ensure_slug,
    map_seo,
    parse_date,
    parse_datetime,
    truncate,
)
from flycatch_api.import_strapi.taxonomies import (
    ensure_author,
    ensure_technology_named,
    resolve_category_ids,
    unique_slug,
)
from flycatch_api.models.author import BlogAuthor
from flycatch_api.models.blog import Blog
from flycatch_api.models.case_study import CaseStudy, ContentStatus
from flycatch_api.models.case_study_category import CaseStudyCategory, CaseStudyCategoryLink
from flycatch_api.models.catalog import (
    News,
    NewsAuthorLink,
    NewsCategory,
    NewsCategoryLink,
    Resource,
    ResourceCategory,
    ResourceCategoryLink,
)
from flycatch_api.models.category import BlogCategory, Category
from flycatch_api.models.industry import CaseStudyIndustry, Industry
from flycatch_api.models.technology import CaseStudyTechnology
from flycatch_api.services.text import sanitize_html


def import_blogs(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("blogs", populate=POPULATE["blogs"]):
            try:
                _import_blog(ctx, entity)
            except Exception as exc:  # noqa: BLE001
                ctx.record_error("blogs", f"id={entity.get('id')}: {exc}")
                local.skipped += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("blogs", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def _import_blog(ctx: ImportContext, entity: dict) -> None:
    title = truncate(entity.get("title") or "Untitled", 200)
    slug_base = ensure_slug(entity.get("slug"), title, warnings=ctx.warnings)
    image_key = ctx.media.import_field(entity.get("image") or entity.get("thumbnail_image"))
    body = ctx.body_html(entity.get("body"))
    status = blog_status(entity)
    created_at = parse_datetime(entity.get("createdAt"))
    updated_at = parse_datetime(entity.get("updatedAt"), created_at)

    author_ids: list = []
    author = relation_one(entity.get("author"))
    writer_images = ctx.media.import_many(entity.get("writer_image"))
    author_name = ""
    if author:
        author_name = as_text(author.get("username") or author.get("name") or author.get("email"))
    if not author_name:
        author_name = as_text(entity.get("author_name"))
    if author_name:
        row_author = ensure_author(
            ctx,
            name=author_name,
            image_keys=writer_images,
            status=ContentStatus.publish,
            strapi_id=author.get("id") if author else None,
        )
        if row_author:
            author_ids.append(row_author.id)

    category_ids = resolve_category_ids(
        ctx, entity.get("categories"), collection="categories", model=Category
    )

    if ctx.dry_run:
        existing = ctx.db.query(Blog).filter(Blog.slug == slug_base).first()
        ctx.id_map.set("blogs", entity.get("id"), existing.id if existing else uuid4())
        if existing:
            local_inc_updated(ctx)
        else:
            local_inc_created(ctx)
        return

    existing = ctx.db.query(Blog).filter(Blog.slug == slug_base).first()
    if existing is None:
        # try map by id if re-run changed slug
        mapped = ctx.id_map.get("blogs", entity.get("id"))
        if mapped:
            existing = ctx.db.query(Blog).filter(Blog.id == mapped).first()

    if existing:
        row = existing
        row.title = title
        row.description = as_text(entity.get("description"))
        row.body = body
        row.status = status
        row.reading_time = as_int(entity.get("reading_time"))
        row.image_key = image_key
        row.image_alt = truncate(entity.get("image_alt") or "", 200)
        row.canonical_url = truncate(entity.get("canonical_url") or "", 500)
        row.facebook = truncate(entity.get("facebook") or "", 500)
        row.linkedin = truncate(entity.get("linkedin") or "", 500)
        row.twitter = truncate(entity.get("twitter") or "", 500)
        row.instagram = truncate(entity.get("instagram") or "", 500)
        row.content_available_in = entity.get("content_available_in") or []
        row.updated_at = updated_at
        row.author_links.clear()
        row.category_links.clear()
        ctx.stats.updated += 1
    else:
        slug = unique_slug(ctx.db, Blog, slug_base)
        row = Blog(
            id=uuid4(),
            title=title,
            slug=slug,
            description=as_text(entity.get("description")),
            body=body,
            status=status,
            reading_time=as_int(entity.get("reading_time")),
            image_key=image_key,
            image_alt=truncate(entity.get("image_alt") or "", 200),
            canonical_url=truncate(entity.get("canonical_url") or "", 500),
            facebook=truncate(entity.get("facebook") or "", 500),
            linkedin=truncate(entity.get("linkedin") or "", 500),
            twitter=truncate(entity.get("twitter") or "", 500),
            instagram=truncate(entity.get("instagram") or "", 500),
            content_available_in=entity.get("content_available_in") or [],
            created_at=created_at,
            updated_at=updated_at,
        )
        ctx.db.add(row)
        ctx.db.flush()
        ctx.stats.created += 1

    for author_id in author_ids:
        row.author_links.append(BlogAuthor(blog_id=row.id, author_id=author_id))
    for category_id in category_ids:
        row.category_links.append(BlogCategory(blog_id=row.id, category_id=category_id))
    ctx.id_map.set("blogs", entity.get("id"), row.id)


def import_case_studies(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("case-studies", populate=POPULATE["case-studies"]):
            try:
                _import_case_study(ctx, entity)
            except Exception as exc:  # noqa: BLE001
                ctx.record_error("case-studies", f"id={entity.get('id')}: {exc}")
                local.skipped += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("case-studies", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def _import_case_study(ctx: ImportContext, entity: dict) -> None:
    heading = truncate(entity.get("heading") or entity.get("title") or "Untitled", 200)
    slug_base = ensure_slug(entity.get("slug"), heading, warnings=ctx.warnings)
    image_key = ctx.media.import_field(entity.get("image"))
    body_raw = entity.get("body")
    body = (
        ctx.body_html(body_raw) if isinstance(body_raw, list) else sanitize_html(as_text(body_raw))
    )
    status = content_status(entity)
    created_at = parse_datetime(entity.get("createdAt"))
    updated_at = parse_datetime(entity.get("updatedAt"), created_at)

    industry_ids = resolve_category_ids(
        ctx,
        entity.get("industry") or entity.get("industries"),
        collection="industries",
        model=Industry,
    )
    category_ids = resolve_category_ids(
        ctx,
        entity.get("contenttype_categories") or entity.get("categories"),
        collection="contenttype-categories",
        model=CaseStudyCategory,
    )
    tech_ids = []
    for tech in relation_list(entity.get("technologies")):
        logo_key = ctx.media.import_field(tech.get("logo"))
        row_tech = ensure_technology_named(
            ctx,
            name=as_text(tech.get("name") or tech.get("Name")),
            logo_key=logo_key,
            strapi_id=tech.get("id"),
        )
        if row_tech:
            tech_ids.append(row_tech.id)

    if ctx.dry_run:
        existing = ctx.db.query(CaseStudy).filter(CaseStudy.slug == slug_base).first()
        ctx.id_map.set("case-studies", entity.get("id"), existing.id if existing else uuid4())
        if existing:
            local_inc_updated(ctx)
        else:
            local_inc_created(ctx)
        return

    existing = ctx.db.query(CaseStudy).filter(CaseStudy.slug == slug_base).first()
    if existing:
        row = existing
        row.heading = heading
        row.short_heading = as_text(entity.get("short_heading"))
        row.description = as_text(entity.get("description"))
        row.body = body
        row.sort_order = as_int(entity.get("order"))
        row.occurred_on = parse_date(entity.get("occurred_on") or entity.get("date"))
        row.status = status
        row.image_key = image_key
        row.image_alt = truncate(entity.get("image_alt") or "", 200)
        row.content_available_in = entity.get("content_available_in") or []
        row.updated_at = updated_at
        row.industry_links.clear()
        row.category_links.clear()
        row.technology_links.clear()
        ctx.stats.updated += 1
    else:
        slug = unique_slug(ctx.db, CaseStudy, slug_base)
        row = CaseStudy(
            id=uuid4(),
            heading=heading,
            slug=slug,
            short_heading=as_text(entity.get("short_heading")),
            description=as_text(entity.get("description")),
            body=body,
            sort_order=as_int(entity.get("order")),
            occurred_on=parse_date(entity.get("occurred_on") or entity.get("date")),
            status=status,
            image_key=image_key,
            image_alt=truncate(entity.get("image_alt") or "", 200),
            content_available_in=entity.get("content_available_in") or [],
            created_at=created_at,
            updated_at=updated_at,
        )
        ctx.db.add(row)
        ctx.db.flush()
        ctx.stats.created += 1

    for industry_id in industry_ids:
        row.industry_links.append(CaseStudyIndustry(case_study_id=row.id, industry_id=industry_id))
    for category_id in category_ids:
        row.category_links.append(
            CaseStudyCategoryLink(case_study_id=row.id, category_id=category_id)
        )
    for technology_id in tech_ids:
        row.technology_links.append(
            CaseStudyTechnology(case_study_id=row.id, technology_id=technology_id)
        )
    ctx.id_map.set("case-studies", entity.get("id"), row.id)


def import_news(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("news", populate=POPULATE["news"]):
            try:
                _import_news(ctx, entity)
            except Exception as exc:  # noqa: BLE001
                ctx.record_error("news", f"id={entity.get('id')}: {exc}")
                local.skipped += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("news", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def _import_news(ctx: ImportContext, entity: dict) -> None:
    title = truncate(entity.get("title") or "Untitled", 200)
    slug_base = ensure_slug(entity.get("slug"), title, warnings=ctx.warnings)
    image_key = ctx.media.import_field(entity.get("image"))
    body = ctx.body_html(entity.get("body"))
    status = content_status(entity)
    created_at = parse_datetime(entity.get("createdAt"))
    updated_at = parse_datetime(entity.get("updatedAt"), created_at)
    seo = map_seo(entity.get("seo"))

    author_ids = []
    for author in relation_list(entity.get("author") or entity.get("authors")):
        name = as_text(author.get("username") or author.get("name") or author.get("email"))
        row_author = ensure_author(
            ctx, name=name, status=ContentStatus.publish, strapi_id=author.get("id")
        )
        if row_author:
            author_ids.append(row_author.id)

    category_ids = resolve_category_ids(
        ctx,
        entity.get("news_categories") or entity.get("categories"),
        collection="news-categories",
        model=NewsCategory,
    )

    if ctx.dry_run:
        existing = ctx.db.query(News).filter(News.slug == slug_base).first()
        ctx.id_map.set("news", entity.get("id"), existing.id if existing else uuid4())
        if existing:
            local_inc_updated(ctx)
        else:
            local_inc_created(ctx)
        return

    existing = ctx.db.query(News).filter(News.slug == slug_base).first()
    if existing:
        row = existing
        row.title = title
        row.body = body
        row.image_key = image_key
        row.description = as_text(entity.get("description"))
        row.button_name = truncate(entity.get("button_name") or "", 120)
        row.reading_time = as_int(entity.get("reading_time"))
        row.facebook = truncate(entity.get("facebook") or "", 500)
        row.linkedin = truncate(entity.get("linkedin") or "", 500)
        row.twitter = truncate(entity.get("twitter") or "", 500)
        row.instagram = truncate(entity.get("instagram") or "", 500)
        row.youtube_url = truncate(entity.get("youtube_url") or "", 500)
        row.seo = seo
        row.status = status
        row.updated_at = updated_at
        row.category_links.clear()
        row.author_links.clear()
        ctx.stats.updated += 1
    else:
        slug = unique_slug(ctx.db, News, slug_base)
        row = News(
            id=uuid4(),
            title=title,
            slug=slug,
            body=body,
            image_key=image_key,
            description=as_text(entity.get("description")),
            button_name=truncate(entity.get("button_name") or "", 120),
            reading_time=as_int(entity.get("reading_time")),
            facebook=truncate(entity.get("facebook") or "", 500),
            linkedin=truncate(entity.get("linkedin") or "", 500),
            twitter=truncate(entity.get("twitter") or "", 500),
            instagram=truncate(entity.get("instagram") or "", 500),
            youtube_url=truncate(entity.get("youtube_url") or "", 500),
            seo=seo,
            status=status,
            created_at=created_at,
            updated_at=updated_at,
        )
        ctx.db.add(row)
        ctx.db.flush()
        ctx.stats.created += 1

    for category_id in category_ids:
        row.category_links.append(NewsCategoryLink(news_id=row.id, category_id=category_id))
    for author_id in author_ids:
        row.author_links.append(NewsAuthorLink(news_id=row.id, author_id=author_id))
    ctx.id_map.set("news", entity.get("id"), row.id)


def import_resources(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("resources", populate=POPULATE["resources"]):
            try:
                _import_resource(ctx, entity)
            except Exception as exc:  # noqa: BLE001
                ctx.record_error("resources", f"id={entity.get('id')}: {exc}")
                local.skipped += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("resources", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def _import_resource(ctx: ImportContext, entity: dict) -> None:
    title = truncate(entity.get("title") or "Untitled", 200)
    slug_base = ensure_slug(entity.get("slug"), title, warnings=ctx.warnings)
    image_key = ctx.media.import_field(entity.get("image"))
    pdf_key = ctx.media.import_field(entity.get("pdf_document") or entity.get("pdf"))
    status = content_status(entity)
    created_at = parse_datetime(entity.get("createdAt"))
    updated_at = parse_datetime(entity.get("updatedAt"), created_at)
    seo = map_seo(entity.get("seo"))
    category_ids = resolve_category_ids(
        ctx, entity.get("categories"), collection="resource-categories", model=ResourceCategory
    )

    if ctx.dry_run:
        existing = ctx.db.query(Resource).filter(Resource.slug == slug_base).first()
        ctx.id_map.set("resources", entity.get("id"), existing.id if existing else uuid4())
        if existing:
            local_inc_updated(ctx)
        else:
            local_inc_created(ctx)
        return

    existing = ctx.db.query(Resource).filter(Resource.slug == slug_base).first()
    if existing:
        row = existing
        row.title = title
        row.image_key = image_key
        row.reading_time = as_int(entity.get("reading_time"))
        row.button_name = truncate(entity.get("button_name") or "", 120)
        row.pdf_key = pdf_key
        row.seo = seo
        row.status = status
        row.updated_at = updated_at
        row.category_links.clear()
        ctx.stats.updated += 1
    else:
        slug = unique_slug(ctx.db, Resource, slug_base)
        row = Resource(
            id=uuid4(),
            title=title,
            slug=slug,
            image_key=image_key,
            reading_time=as_int(entity.get("reading_time")),
            button_name=truncate(entity.get("button_name") or "", 120),
            pdf_key=pdf_key,
            seo=seo,
            status=status,
            created_at=created_at,
            updated_at=updated_at,
        )
        ctx.db.add(row)
        ctx.db.flush()
        ctx.stats.created += 1

    for category_id in category_ids:
        row.category_links.append(ResourceCategoryLink(resource_id=row.id, category_id=category_id))
    ctx.id_map.set("resources", entity.get("id"), row.id)


def local_inc_created(ctx: ImportContext) -> None:
    ctx.stats.created += 1


def local_inc_updated(ctx: ImportContext) -> None:
    ctx.stats.updated += 1
