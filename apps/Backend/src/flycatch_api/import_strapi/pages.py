from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from flycatch_api.import_strapi.client import relation_list
from flycatch_api.import_strapi.context import ImportContext, ImportStats
from flycatch_api.import_strapi.editorial import local_inc_created, local_inc_updated
from flycatch_api.import_strapi.mappers import (
    first_attr,
    map_accordion,
    map_home_faqs,
    map_home_services,
    rewrite_media_in_json,
)
from flycatch_api.import_strapi.populate import POPULATE
from flycatch_api.import_strapi.status import (
    SlugCollisionError,
    as_bool,
    as_int,
    as_text,
    content_status,
    ensure_slug,
    map_seo,
    parse_datetime,
    truncate,
)
from flycatch_api.import_strapi.taxonomies import claim_existing_slug, unique_slug
from flycatch_api.models.ai_service import AiService, AiServiceSolution
from flycatch_api.models.catalog import FlycatchSaudiArabia
from flycatch_api.models.cloud_service import CloudService
from flycatch_api.models.data_analytics import DataAnalytics
from flycatch_api.models.digital_transformation import DigitalTransformation
from flycatch_api.models.home import Home, HomeCaseStudy
from flycatch_api.models.landing_pages import (
    ApplicationDevelopment,
    ApplicationModernization,
    DevOpsConsult,
    InfrastructureManagement,
    MobileApplicationDevelopment,
    Overview,
    UserCenteredDesign,
)
from flycatch_api.models.solution import Solution
from flycatch_api.models.solution_detail import SolutionDetail
from flycatch_api.models.solution_product import SolutionProduct
from flycatch_api.services.text import sanitize_html


def _singleton_or_first(entities: list[dict]) -> dict | None:
    return entities[0] if entities else None


def import_homes(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        homes = ctx.client.list_all("homepages", populate=POPULATE["homepages"])
        seo_rows = []
        try:
            seo_rows = ctx.client.list_all("homepage-seo", populate=POPULATE["homepage-seo"])
        except Exception:  # noqa: BLE001
            seo_rows = []
        seo_payload = map_seo(_singleton_or_first(seo_rows) or {})
        entity = _singleton_or_first(homes)
        if not entity:
            local.skipped += 1
            before.merge(local)
            ctx.stats = before
            return local
        if entity.get("seo"):
            seo_payload = map_seo(entity.get("seo"))
        title = truncate(entity.get("title") or entity.get("banner_title") or "Home", 200)
        video_raw = entity.get("video_file") or entity.get("banner_video") or entity.get("video")
        video_key = ctx.media.import_field(video_raw)
        video_content_type = ctx.media.guess_content_type(video_raw) if video_key else None
        services = map_home_services(ctx, entity.get("services_section") or entity.get("services"))
        faqs = map_home_faqs(entity.get("faqs") or entity.get("faq"))
        status = content_status(entity)
        created_at = parse_datetime(entity.get("createdAt"))
        updated_at = parse_datetime(entity.get("updatedAt"), created_at)
        case_study_ids = []
        for rel in relation_list(entity.get("case_studies") or entity.get("caseStudies")):
            mapped = ctx.id_map.get("case-studies", rel.get("id"))
            if mapped is None:
                slug = ensure_slug(
                    rel.get("slug"),
                    as_text(rel.get("heading") or rel.get("title") or ""),
                )
                if slug:
                    from flycatch_api.models.case_study import CaseStudy

                    row_cs = ctx.db.query(CaseStudy).filter(CaseStudy.slug == slug).first()
                    mapped = row_cs.id if row_cs else None
                    if mapped:
                        ctx.id_map.set("case-studies", rel.get("id"), mapped)
            if mapped:
                case_study_ids.append(mapped)
        if ctx.dry_run:
            existing = ctx.db.query(Home).order_by(Home.created_at).first()
            if existing:
                local_inc_updated(ctx)
            else:
                local_inc_created(ctx)
            before.merge(local)
            ctx.stats = before
            return local
        existing = ctx.db.query(Home).order_by(Home.created_at).first()
        fields = dict(
            title=title,
            video_key=video_key,
            video_content_type=video_content_type,
            banner_title=truncate(entity.get("banner_title") or "", 200),
            seo=seo_payload,
            services=services,
            banner_explore_text=truncate(entity.get("banner_explore_text") or "", 200),
            faq_title=truncate(entity.get("faq_title") or "", 200),
            faq_description=sanitize_html(as_text(entity.get("faq_description"))),
            faqs=faqs,
            content_available_in=entity.get("content_available_in") or [],
            status=status,
        )
        if existing:
            for key, value in fields.items():
                setattr(existing, key, value)
            existing.updated_at = updated_at
            existing.case_study_links.clear()
            row = existing
            local.updated += 1
        else:
            row = Home(id=uuid4(), created_at=created_at, updated_at=updated_at, **fields)
            ctx.db.add(row)
            ctx.db.flush()
            local.created += 1
        for index, case_study_id in enumerate(case_study_ids):
            row.case_study_links.append(
                HomeCaseStudy(home_id=row.id, case_study_id=case_study_id, sort_order=index)
            )
        ctx.id_map.set("homepages", entity.get("id"), row.id)
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("homepages", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_solutions(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        entities = ctx.client.list_all("solutions", populate=POPULATE["solutions"])
        entity = _singleton_or_first(entities)
        if not entity:
            local.skipped += 1
            before.merge(local)
            ctx.stats = before
            return local
        banner_image_key = ctx.media.import_field(entity.get("banner_image"))
        seo = map_seo(entity.get("seo"))
        status = content_status(entity)
        created_at = parse_datetime(entity.get("createdAt"))
        updated_at = parse_datetime(entity.get("updatedAt"), created_at)
        if ctx.dry_run:
            existing = ctx.db.query(Solution).order_by(Solution.created_at).first()
            if existing:
                local_inc_updated(ctx)
            else:
                local_inc_created(ctx)
            before.merge(local)
            ctx.stats = before
            return local
        existing = ctx.db.query(Solution).order_by(Solution.created_at).first()
        fields = dict(
            banner_image_key=banner_image_key,
            banner_title=truncate(entity.get("banner_title") or "", 200),
            section_title=truncate(entity.get("section_title") or "", 200),
            seo=seo,
            status=status,
        )
        if existing:
            for key, value in fields.items():
                setattr(existing, key, value)
            existing.updated_at = updated_at
            ctx.id_map.set("solutions", entity.get("id"), existing.id)
            local.updated += 1
        else:
            row = Solution(id=uuid4(), created_at=created_at, updated_at=updated_at, **fields)
            ctx.db.add(row)
            ctx.db.flush()
            ctx.id_map.set("solutions", entity.get("id"), row.id)
            local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("solutions", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_solution_details(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "solution-details", populate=POPULATE["solution-details"]
        ):
            title = truncate(entity.get("title") or "Solution", 200)
            slug_base = ensure_slug(entity.get("slug"), title, warnings=ctx.warnings)
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            updated_at = parse_datetime(entity.get("updatedAt"), created_at)
            fields = dict(
                title=title,
                banner=rewrite_media_in_json(ctx, entity.get("banner") or {}),
                introduction=rewrite_media_in_json(ctx, entity.get("introduction") or {}),
                challenges=rewrite_media_in_json(ctx, entity.get("challenges") or {}),
                benefits=rewrite_media_in_json(ctx, entity.get("benefits") or {}),
                solutions_section=rewrite_media_in_json(ctx, entity.get("solutions_section") or {}),
                cta=rewrite_media_in_json(ctx, entity.get("cta") or {}),
                seo=map_seo(entity.get("seo")),
                status=status,
            )
            if ctx.dry_run:
                existing = (
                    ctx.db.query(SolutionDetail).filter(SolutionDetail.slug == slug_base).first()
                )
                ctx.id_map.set(
                    "solution-details", entity.get("id"), existing.id if existing else uuid4()
                )
                if existing:
                    local_inc_updated(ctx)
                else:
                    local_inc_created(ctx)
                continue
            existing = ctx.db.query(SolutionDetail).filter(SolutionDetail.slug == slug_base).first()
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                existing.updated_at = updated_at
                ctx.id_map.set("solution-details", entity.get("id"), existing.id)
                local.updated += 1
            else:
                slug = unique_slug(ctx.db, SolutionDetail, slug_base)
                row = SolutionDetail(
                    id=uuid4(), slug=slug, created_at=created_at, updated_at=updated_at, **fields
                )
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("solution-details", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("solution-details", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_solution_products(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("products", populate=POPULATE["products"]):
            title = truncate(entity.get("product_title") or entity.get("title") or "Product", 200)
            slug_base = ensure_slug(entity.get("slug"), title, warnings=ctx.warnings)
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            updated_at = parse_datetime(entity.get("updatedAt"), created_at)
            fields = dict(
                product_title=title,
                product_description=sanitize_html(
                    as_text(entity.get("product_description") or entity.get("description"))
                    if not isinstance(entity.get("product_description"), list)
                    else ctx.body_html(entity.get("product_description"))
                ),
                product_tag=truncate(entity.get("product_tag") or "", 120),
                product_logo_key=ctx.media.import_field(entity.get("product_logo")),
                product_card_image_key=ctx.media.import_field(entity.get("product_card_image")),
                product_banner_image_key=ctx.media.import_field(entity.get("product_banner_image")),
                card_image_on_right=as_bool(entity.get("card_image_on_right")),
                banner_image_on_right=as_bool(entity.get("banner_image_on_right")),
                order=as_int(entity.get("order")),
                seo=map_seo(
                    entity.get("seo"),
                    image_key=ctx.media.import_field(
                        (entity.get("seo") or {}).get("image")
                        if isinstance(entity.get("seo"), dict)
                        else None
                    ),
                    fallback={
                        "title": title,
                        "description": entity.get("product_description")
                        if not isinstance(entity.get("product_description"), list)
                        else "",
                        "canonical_url": entity.get("canonical_url"),
                        "image_alt": entity.get("image_alt"),
                    },
                ),
                status=status,
            )
            if ctx.dry_run:
                existing = (
                    ctx.db.query(SolutionProduct).filter(SolutionProduct.slug == slug_base).first()
                )
                ctx.id_map.set("products", entity.get("id"), existing.id if existing else uuid4())
                if existing:
                    local_inc_updated(ctx)
                else:
                    local_inc_created(ctx)
                continue
            existing = (
                ctx.db.query(SolutionProduct).filter(SolutionProduct.slug == slug_base).first()
            )
            if not claim_existing_slug(ctx, "products", entity, existing):
                continue
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                existing.updated_at = updated_at
                ctx.id_map.set("products", entity.get("id"), existing.id)
                local.updated += 1
            else:
                try:
                    slug = unique_slug(ctx.db, SolutionProduct, slug_base)
                except SlugCollisionError as exc:
                    ctx.record_error("products", str(exc))
                    local.skipped += 1
                    continue
                row = SolutionProduct(
                    id=uuid4(), slug=slug, created_at=created_at, updated_at=updated_at, **fields
                )
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("products", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("products", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def _upsert_by_slug(
    ctx: ImportContext,
    *,
    model: type,
    collection: str,
    entity: dict,
    slug_base: str,
    fields: dict[str, Any],
    created_at: datetime,
    updated_at: datetime,
) -> None:
    if ctx.dry_run:
        existing = ctx.db.query(model).filter(model.slug == slug_base).first()
        ctx.id_map.set(collection, entity.get("id"), existing.id if existing else uuid4())
        if existing:
            local_inc_updated(ctx)
        else:
            local_inc_created(ctx)
        return
    existing = ctx.db.query(model).filter(model.slug == slug_base).first()
    if not claim_existing_slug(ctx, collection, entity, existing):
        return
    if existing:
        for key, value in fields.items():
            setattr(existing, key, value)
        if hasattr(existing, "updated_at"):
            existing.updated_at = updated_at
        ctx.id_map.set(collection, entity.get("id"), existing.id)
        ctx.stats.updated += 1
        return
    try:
        slug = unique_slug(ctx.db, model, slug_base)
    except SlugCollisionError as exc:
        ctx.record_error(collection, str(exc))
        ctx.stats.skipped += 1
        return
    kwargs = dict(fields)
    kwargs["slug"] = slug
    kwargs["created_at"] = created_at
    if "updated_at" in model.__table__.c:  # type: ignore[attr-defined]
        kwargs["updated_at"] = updated_at
    row = model(id=uuid4(), **kwargs)
    ctx.db.add(row)
    ctx.db.flush()
    ctx.id_map.set(collection, entity.get("id"), row.id)
    ctx.stats.created += 1


def _upsert_by_page_name(
    ctx: ImportContext,
    *,
    model: type,
    collection: str,
    entity: dict,
    page_name: str,
    fields: dict[str, Any],
    created_at: datetime,
    updated_at: datetime,
) -> None:
    if ctx.dry_run:
        existing = ctx.db.query(model).filter(model.page_name == page_name).first()
        ctx.id_map.set(collection, entity.get("id"), existing.id if existing else uuid4())
        if existing:
            local_inc_updated(ctx)
        else:
            local_inc_created(ctx)
        return
    existing = ctx.db.query(model).filter(model.page_name == page_name).first()
    if existing:
        for key, value in fields.items():
            setattr(existing, key, value)
        existing.updated_at = updated_at
        ctx.id_map.set(collection, entity.get("id"), existing.id)
        ctx.stats.updated += 1
        return
    row = model(
        id=uuid4(),
        page_name=page_name,
        created_at=created_at,
        updated_at=updated_at,
        **fields,
    )
    ctx.db.add(row)
    ctx.db.flush()
    ctx.id_map.set(collection, entity.get("id"), row.id)
    ctx.stats.created += 1


def _landing_common(ctx: ImportContext, entity: dict) -> tuple[dict, str, datetime, datetime]:
    slug_hint = as_text(
        entity.get("slug") or entity.get("page_name") or entity.get("banner_title") or "page"
    )
    slug_base = ensure_slug(
        entity.get("slug") or entity.get("page_name"), slug_hint, warnings=ctx.warnings
    )
    created_at = parse_datetime(entity.get("createdAt"))
    updated_at = parse_datetime(entity.get("updatedAt"), created_at)
    fields = dict(
        banner_title=truncate(entity.get("banner_title") or "", 200),
        banner_image_key=ctx.media.import_field(entity.get("banner_image")),
        introduction_title=truncate(entity.get("introduction_title") or "", 200),
        introduction_first_paragraph=sanitize_html(
            as_text(entity.get("introduction_first_paragraph"))
        ),
        introduction_second_paragraph=sanitize_html(
            as_text(entity.get("introduction_second_paragraph"))
        ),
        seo=map_seo(entity.get("seo")),
        status=content_status(entity),
    )
    return fields, slug_base, created_at, updated_at


def _link_ai_service_solutions(ctx: ImportContext, row: AiService, entity: dict) -> None:
    refs = relation_list(entity.get("solutions_sections") or entity.get("solution_details"))
    if ctx.dry_run:
        for rel in refs:
            slug = as_text(rel.get("slug"))
            mapped = ctx.id_map.get("solution-details", rel.get("id"))
            if mapped is None and slug:
                existing = ctx.db.query(SolutionDetail).filter(SolutionDetail.slug == slug).first()
                mapped = existing.id if existing else None
            if mapped is None:
                ctx.warnings.append(
                    f"ai-services: unmatched solution {rel.get('id')} slug={slug!r}"
                )
        return
    row.solution_links.clear()
    position = 0
    for rel in refs:
        mapped = ctx.id_map.get("solution-details", rel.get("id"))
        if mapped is None:
            slug = as_text(rel.get("slug"))
            if slug:
                existing = ctx.db.query(SolutionDetail).filter(SolutionDetail.slug == slug).first()
                mapped = existing.id if existing else None
                if mapped:
                    ctx.id_map.set("solution-details", rel.get("id"), mapped)
        if mapped is None:
            ctx.record_error(
                "ai-services",
                f"unmatched solution {rel.get('id')} slug={rel.get('slug')!r}",
            )
            continue
        row.solution_links.append(
            AiServiceSolution(
                ai_service_id=row.id,
                solution_detail_id=mapped,
                position=position,
            )
        )
        position += 1


def import_ai_services(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("ai-services", populate=POPULATE["ai-services"]):
            slug_base = ensure_slug(
                entity.get("slug") or "ai-services", "ai-services", warnings=ctx.warnings
            )
            created_at = parse_datetime(entity.get("createdAt"))
            updated_at = parse_datetime(entity.get("updatedAt"), created_at)
            industry_items = []
            for item in relation_list(
                entity.get("industry_section") or entity.get("industry_items")
            ):
                industry_items.append(rewrite_media_in_json(ctx, item))
            fields = dict(
                banner_title=truncate(entity.get("banner_title") or "", 200),
                banner_image_key=ctx.media.import_field(entity.get("banner_image")),
                introduction_title=truncate(entity.get("introduction_title") or "", 200),
                introduction_description=sanitize_html(
                    as_text(entity.get("introduction_description"))
                ),
                solutions_title=truncate(entity.get("solutions_title") or "", 200),
                solutions_description=sanitize_html(as_text(entity.get("solutions_description"))),
                industry_title=truncate(entity.get("industry_title") or "", 200),
                industry_description=sanitize_html(as_text(entity.get("industry_description"))),
                industry_items=industry_items,
                ai_expertise_title=truncate(entity.get("ai_expertise_title") or "", 200),
                ai_expertise_image_key=ctx.media.import_field(entity.get("ai_expertise_image")),
                ai_expertise_accordion=map_accordion(
                    ctx,
                    entity.get("ai_expertise_accordian") or entity.get("ai_expertise_accordion"),
                ),
                ai_expertise_accordion_description=sanitize_html(
                    as_text(entity.get("ai_expertise_accordion_description"))
                ),
                faq_title=truncate(entity.get("faq_title") or "", 200),
                faq_description=sanitize_html(as_text(entity.get("faq_description"))),
                faq_accordion=map_accordion(
                    ctx,
                    entity.get("faq_accordion")
                    or entity.get("faq_accordian")
                    or entity.get("faqs"),
                ),
                seo=map_seo(entity.get("seo")),
                status=content_status(entity),
            )
            _upsert_by_slug(
                ctx,
                model=AiService,
                collection="ai-services",
                entity=entity,
                slug_base=slug_base,
                fields=fields,
                created_at=created_at,
                updated_at=updated_at,
            )
            row = ctx.db.query(AiService).filter(AiService.slug == slug_base).first()
            if row is not None:
                _link_ai_service_solutions(ctx, row, entity)
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("ai-services", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_cloud_services(ctx: ImportContext) -> ImportStats:
    return _import_named_service_pages(
        ctx,
        collection="cloud-services",
        model=CloudService,
        accordion_key="cloud_service_accordion",
        offering_image_key="cloud_service_offering_image",
    )


def import_data_analytics(ctx: ImportContext) -> ImportStats:
    return _import_named_service_pages(
        ctx,
        collection="data-and-analytics",
        model=DataAnalytics,
        accordion_key="accordion_section",
        offering_image_key="offering_image",
        map_collection="data-analytics",
    )


def _import_named_service_pages(
    ctx: ImportContext,
    *,
    collection: str,
    model: type,
    accordion_key: str,
    offering_image_key: str,
    map_collection: str | None = None,
) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    id_collection = map_collection or collection
    try:
        for entity in ctx.client.list_all(collection, populate=POPULATE[collection]):
            page_name = truncate(
                entity.get("page_name")
                or entity.get("slug")
                or entity.get("banner_title")
                or "default",
                64,
            )
            page_name = ensure_slug(page_name, "default")[:64]
            created_at = parse_datetime(entity.get("createdAt"))
            updated_at = parse_datetime(entity.get("updatedAt"), created_at)
            offering_desc = entity.get("offering_description")
            if isinstance(offering_desc, list):
                offering_desc = ctx.body_html(offering_desc)
            else:
                offering_desc = sanitize_html(as_text(offering_desc))
            fields = dict(
                banner_title=truncate(entity.get("banner_title") or "", 200),
                banner_image_key=ctx.media.import_field(entity.get("banner_image")),
                introduction_title=truncate(entity.get("introduction_title") or "", 200),
                introduction_first_paragraph=sanitize_html(
                    as_text(entity.get("introduction_first_paragraph"))
                ),
                introduction_second_paragraph=sanitize_html(
                    as_text(entity.get("introduction_second_paragraph"))
                ),
                accordion=map_accordion(ctx, entity.get(accordion_key) or entity.get("accordion")),
                offering_image_key=ctx.media.import_field(
                    entity.get(offering_image_key) or entity.get("offering_image")
                ),
                offering_title=truncate(entity.get("offering_title") or "", 200),
                offering_description=offering_desc,
                faq_title=truncate(entity.get("faq_title") or "", 200),
                faq_description=sanitize_html(as_text(entity.get("faq_description"))),
                faq_accordion=map_accordion(ctx, entity.get("faq_accordion")),
                seo=map_seo(entity.get("seo")),
                status=content_status(entity),
            )
            _upsert_by_page_name(
                ctx,
                model=model,
                collection=id_collection,
                entity=entity,
                page_name=page_name,
                fields=fields,
                created_at=created_at,
                updated_at=updated_at,
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error(collection, str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_digital_transformation(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "digital-transformations", populate=POPULATE["digital-transformations"]
        ):
            fields, slug_base, created_at, updated_at = _landing_common(ctx, entity)
            outcomes_desc = entity.get("outcomes_description")
            if isinstance(outcomes_desc, list):
                outcomes_desc = ctx.body_html(outcomes_desc)
            else:
                outcomes_desc = sanitize_html(as_text(outcomes_desc))
            fields.update(
                banner_tag_line=truncate(entity.get("banner_tag_line") or "", 200),
                accordion=map_accordion(
                    ctx,
                    entity.get("digital_transformation_accordion") or entity.get("accordion"),
                ),
                outcomes_image_key=ctx.media.import_field(entity.get("outcomes_image")),
                outcomes_title=truncate(entity.get("outcomes_title") or "", 200),
                outcomes_description=outcomes_desc,
                faq_title=truncate(entity.get("faq_title") or "", 200),
                faq_description=sanitize_html(as_text(entity.get("faq_description"))),
                faq_accordion=map_accordion(ctx, entity.get("faq_accordion")),
            )
            _upsert_by_slug(
                ctx,
                model=DigitalTransformation,
                collection="digital-transformations",
                entity=entity,
                slug_base=slug_base or "digital-transformation",
                fields=fields,
                created_at=created_at,
                updated_at=updated_at,
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("digital-transformations", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def _import_offering_landing(
    ctx: ImportContext,
    *,
    collection: str,
    model: type,
    accordion_keys: tuple[str, ...],
    offering_image_keys: tuple[str, ...],
    extra_fields: dict[str, Any] | None = None,
    default_slug: str = "page",
) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(collection, populate=POPULATE[collection]):
            fields, slug_base, created_at, updated_at = _landing_common(ctx, entity)
            accordion_raw = first_attr(entity, *accordion_keys, default=[])
            offering_image = first_attr(entity, *offering_image_keys)
            offering_desc = entity.get("offering_description")
            if isinstance(offering_desc, list):
                offering_desc = ctx.body_html(offering_desc)
            else:
                offering_desc = sanitize_html(as_text(offering_desc))
            fields.update(
                accordion=map_accordion(ctx, accordion_raw),
                offering_image_key=ctx.media.import_field(offering_image),
                offering_title=truncate(entity.get("offering_title") or "", 200),
                offering_description=offering_desc,
                faq_title=truncate(entity.get("faq_title") or "", 200),
                faq_description=sanitize_html(as_text(entity.get("faq_description"))),
                faq_accordion=map_accordion(ctx, entity.get("faq_accordion")),
            )
            if extra_fields:
                for key, getter in extra_fields.items():
                    fields[key] = getter(ctx, entity)
            _upsert_by_slug(
                ctx,
                model=model,
                collection=collection,
                entity=entity,
                slug_base=slug_base or default_slug,
                fields=fields,
                created_at=created_at,
                updated_at=updated_at,
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error(collection, str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_application_development(ctx: ImportContext) -> ImportStats:
    return _import_offering_landing(
        ctx,
        collection="application-development-services",
        model=ApplicationDevelopment,
        accordion_keys=("application_development_accordion", "accordion"),
        offering_image_keys=("offering_img", "offering_image"),
        extra_fields={
            "content_available_in": lambda _c, e: e.get("content_available_in") or [],
        },
        default_slug="application-development",
    )


def import_application_modernization(ctx: ImportContext) -> ImportStats:
    return _import_offering_landing(
        ctx,
        collection="application-modernizations",
        model=ApplicationModernization,
        accordion_keys=("application_modernization_accordion", "accordion"),
        offering_image_keys=("application_modernization_offering_image", "offering_image"),
        default_slug="application-modernization",
    )


def import_mobile_application_development(ctx: ImportContext) -> ImportStats:
    return _import_offering_landing(
        ctx,
        collection="mobile-application-developments",
        model=MobileApplicationDevelopment,
        accordion_keys=("mobile_application_accordion", "accordion"),
        offering_image_keys=("offering_image",),
        extra_fields={
            "introduction_third_paragraph": lambda _c, e: sanitize_html(
                as_text(e.get("introduction_third_paragraph"))
            ),
        },
        default_slug="mobile-application-development",
    )


def import_user_centered_design(ctx: ImportContext) -> ImportStats:
    return _import_offering_landing(
        ctx,
        collection="user-centered-designs",
        model=UserCenteredDesign,
        accordion_keys=("accordion_section", "accordion"),
        offering_image_keys=("offering_image",),
        default_slug="user-centered-design",
    )


def import_devops_consult(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "dev-ops-consultations", populate=POPULATE["dev-ops-consultations"]
        ):
            fields, slug_base, created_at, updated_at = _landing_common(ctx, entity)
            fields.update(
                experience_title=truncate(entity.get("experience_title") or "", 200),
                experience_accordion=map_accordion(ctx, entity.get("experience_accordion")),
                experience_image_key=ctx.media.import_field(entity.get("experience_image")),
                experience_description=sanitize_html(as_text(entity.get("experience_description"))),
                faq_title=truncate(entity.get("faq_title") or "", 200),
                faq_description=sanitize_html(as_text(entity.get("faq_description"))),
                faq_accordion=map_accordion(ctx, entity.get("faq_accordion")),
            )
            _upsert_by_slug(
                ctx,
                model=DevOpsConsult,
                collection="dev-ops-consultations",
                entity=entity,
                slug_base=slug_base or "devops-consult",
                fields=fields,
                created_at=created_at,
                updated_at=updated_at,
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("dev-ops-consultations", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_infrastructure_management(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "infrastructure-management-and-automations",
            populate=POPULATE["infrastructure-management-and-automations"],
        ):
            fields, slug_base, created_at, updated_at = _landing_common(ctx, entity)
            fields.update(
                faq_title=truncate(entity.get("faq_title") or "", 200),
                faq_description=sanitize_html(as_text(entity.get("faq_description"))),
                faq_accordion=map_accordion(ctx, entity.get("faq_accordion")),
            )
            _upsert_by_slug(
                ctx,
                model=InfrastructureManagement,
                collection="infrastructure-management-and-automations",
                entity=entity,
                slug_base=slug_base or "infrastructure-management",
                fields=fields,
                created_at=created_at,
                updated_at=updated_at,
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("infrastructure-management-and-automations", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_overview(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("services", populate=POPULATE["services"]):
            fields, slug_base, created_at, updated_at = _landing_common(ctx, entity)
            _upsert_by_slug(
                ctx,
                model=Overview,
                collection="services",
                entity=entity,
                slug_base=slug_base or "services",
                fields=fields,
                created_at=created_at,
                updated_at=updated_at,
            )
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("services", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_flycatch_saudi_arabia(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        entities = ctx.client.list_all(
            "flycatch-saudi-arabias", populate=POPULATE["flycatch-saudi-arabias"]
        )
        entity = _singleton_or_first(entities)
        if not entity:
            local.skipped += 1
            before.merge(local)
            ctx.stats = before
            return local
        service_section = map_home_services(
            ctx, entity.get("services_section") or entity.get("service_section")
        )
        # Adapt home services shape → saudi service_section list of dicts as-is
        video_key = ctx.media.import_field(entity.get("video_file"))
        banner_image_key = ctx.media.import_field(
            entity.get("flycatch_saudi_arabia_banner_image") or entity.get("banner_image")
        )
        status = content_status(entity)
        created_at = parse_datetime(entity.get("createdAt"))
        fields = dict(
            banner_title=truncate(
                entity.get("banner_title")
                or entity.get("flycatch_saudi_arabia_banner_title")
                or "Flycatch Saudi Arabia",
                200,
            ),
            service_section=service_section,
            banner_explore_text=truncate(entity.get("banner_explore_text") or "", 200),
            services_title=truncate(entity.get("services_title") or "", 200),
            banner_image_key=banner_image_key,
            video_key=video_key,
            seo=map_seo(entity.get("seo"), image_key=banner_image_key),
            status=status,
        )
        if ctx.dry_run:
            existing = (
                ctx.db.query(FlycatchSaudiArabia).order_by(FlycatchSaudiArabia.created_at).first()
            )
            if existing:
                local_inc_updated(ctx)
            else:
                local_inc_created(ctx)
            before.merge(local)
            ctx.stats = before
            return local
        existing = (
            ctx.db.query(FlycatchSaudiArabia).order_by(FlycatchSaudiArabia.created_at).first()
        )
        if existing:
            for key, value in fields.items():
                setattr(existing, key, value)
            ctx.id_map.set("flycatch-saudi-arabias", entity.get("id"), existing.id)
            local.updated += 1
        else:
            row = FlycatchSaudiArabia(id=uuid4(), created_at=created_at, **fields)
            ctx.db.add(row)
            ctx.db.flush()
            ctx.id_map.set("flycatch-saudi-arabias", entity.get("id"), row.id)
            local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("flycatch-saudi-arabias", str(exc))
    before.merge(local)
    ctx.stats = before
    return local
