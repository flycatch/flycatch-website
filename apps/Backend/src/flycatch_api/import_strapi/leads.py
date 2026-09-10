from __future__ import annotations

from uuid import uuid4

from flycatch_api.import_strapi.client import relation_list
from flycatch_api.import_strapi.context import ImportContext, ImportStats
from flycatch_api.import_strapi.editorial import local_inc_created, local_inc_updated
from flycatch_api.import_strapi.populate import POPULATE
from flycatch_api.import_strapi.status import (
    as_bool,
    as_float,
    as_int,
    as_text,
    content_status,
    ensure_slug,
    map_seo,
    parse_date,
    parse_datetime,
    truncate,
)
from flycatch_api.import_strapi.taxonomies import unique_slug
from flycatch_api.models.catalog import (
    Application,
    Contact,
    Download,
    EmployeeTestimonial,
    Membership,
    Opening,
    OpeningApplication,
    Subscription,
)
from flycatch_api.models.client_logo import ClientLogo
from flycatch_api.models.client_testimonial import ClientTestimonial
from flycatch_api.services.text import sanitize_html


def import_client_logos(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("client-logos", populate=POPULATE["client-logos"]):
            colour = ctx.media.import_field(
                entity.get("colour_logo") or entity.get("color_logo") or entity.get("logo")
            )
            white = ctx.media.import_field(entity.get("white_logo"))
            alt = truncate(entity.get("alt_text") or entity.get("name") or "Client logo", 200)
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            if ctx.dry_run:
                local.created += 1
                continue
            # Upsert by alt_text + colour key when possible
            existing = None
            if colour:
                existing = (
                    ctx.db.query(ClientLogo).filter(ClientLogo.colour_logo_key == colour).first()
                )
            if existing is None:
                existing = (
                    ctx.db.query(ClientLogo)
                    .filter(ClientLogo.alt_text == alt, ClientLogo.white_logo_key == white)
                    .first()
                )
            if existing:
                existing.colour_logo_key = colour
                existing.white_logo_key = white
                existing.alt_text = alt
                existing.status = status
                ctx.id_map.set("client-logos", entity.get("id"), existing.id)
                local.updated += 1
            else:
                row = ClientLogo(
                    id=uuid4(),
                    colour_logo_key=colour,
                    white_logo_key=white,
                    alt_text=alt,
                    status=status,
                    created_at=created_at,
                )
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("client-logos", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("client-logos", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_client_testimonials(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "client-testimonials", populate=POPULATE["client-testimonials"]
        ):
            client_name = truncate(entity.get("client_name") or "Client", 120)
            title = truncate(entity.get("title") or "", 200)
            review = sanitize_html(as_text(entity.get("review")))
            image_key = ctx.media.import_field(entity.get("image"))
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            if ctx.dry_run:
                existing = (
                    ctx.db.query(ClientTestimonial)
                    .filter(
                        ClientTestimonial.client_name == client_name,
                        ClientTestimonial.title == title,
                    )
                    .first()
                )
                if existing:
                    local_inc_updated(ctx)
                else:
                    local_inc_created(ctx)
                continue
            existing = (
                ctx.db.query(ClientTestimonial)
                .filter(
                    ClientTestimonial.client_name == client_name,
                    ClientTestimonial.title == title,
                )
                .first()
            )
            fields = dict(
                client_name=client_name,
                title=title,
                review=review,
                client_designation=truncate(entity.get("client_designation") or "", 200),
                client_company=truncate(entity.get("client_company") or "", 200),
                country=truncate(entity.get("country") or "", 120),
                image_key=image_key,
                alt_text=truncate(entity.get("image_alt") or entity.get("alt_text") or "", 200),
                is_clutch_review=as_bool(entity.get("is_clutch_review")),
                sort_order=as_int(entity.get("order")),
                review_link=truncate(entity.get("review_link") or "", 500),
                content_available_in=entity.get("content_available_in") or [],
                status=status,
            )
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                ctx.id_map.set("client-testimonials", entity.get("id"), existing.id)
                local.updated += 1
            else:
                row = ClientTestimonial(id=uuid4(), created_at=created_at, **fields)
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("client-testimonials", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("client-testimonials", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_employee_testimonials(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all(
            "employee-testimonials", populate=POPULATE["employee-testimonials"]
        ):
            name = truncate(entity.get("name") or "Employee", 120)
            review = sanitize_html(as_text(entity.get("review")))
            image_key = ctx.media.import_field(entity.get("image"))
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            if ctx.dry_run:
                local.created += 1
                continue
            existing = (
                ctx.db.query(EmployeeTestimonial)
                .filter(EmployeeTestimonial.name == name, EmployeeTestimonial.review == review)
                .first()
            )
            fields = dict(
                name=name,
                designation=truncate(entity.get("designation") or "", 200),
                review=review,
                image_key=image_key,
                sort_order=as_int(entity.get("order")),
                listed=as_bool(entity.get("listed")),
                publish_date=parse_date(entity.get("publish_date") or entity.get("publishedAt")),
                status=status,
            )
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                ctx.id_map.set("employee-testimonials", entity.get("id"), existing.id)
                local.updated += 1
            else:
                row = EmployeeTestimonial(id=uuid4(), created_at=created_at, **fields)
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("employee-testimonials", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("employee-testimonials", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_openings(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("openings", populate=POPULATE["openings"]):
            role = truncate(entity.get("role") or "Role", 200)
            slug_base = ensure_slug(entity.get("slug"), role, warnings=ctx.warnings)
            body_raw = entity.get("body") or entity.get("description")
            body = (
                ctx.body_html(body_raw)
                if isinstance(body_raw, list)
                else sanitize_html(as_text(body_raw))
            )
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            if ctx.dry_run:
                existing = ctx.db.query(Opening).filter(Opening.slug == slug_base).first()
                ctx.id_map.set("openings", entity.get("id"), existing.id if existing else uuid4())
                if existing:
                    local_inc_updated(ctx)
                else:
                    local_inc_created(ctx)
                continue
            existing = ctx.db.query(Opening).filter(Opening.slug == slug_base).first()
            fields = dict(
                job_id=truncate(entity.get("job_id") or entity.get("jobId") or slug_base, 80),
                exp_date=parse_date(entity.get("exp_date") or entity.get("expiry_date")),
                role=role,
                experience=truncate(entity.get("experience") or "", 200),
                location=truncate(entity.get("location") or "Kochi", 40),
                job_type=truncate(entity.get("job_type") or entity.get("type") or "Full-Time", 40),
                job_status=truncate(entity.get("job_status") or "Ongoing", 40),
                specialization=truncate(
                    entity.get("specialization") or entity.get("type") or "FullStack", 40
                ),
                body=body,
                status=status,
            )
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                ctx.id_map.set("openings", entity.get("id"), existing.id)
                local.updated += 1
            else:
                slug = unique_slug(ctx.db, Opening, slug_base)
                row = Opening(id=uuid4(), slug=slug, created_at=created_at, **fields)
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("openings", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("openings", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_applications(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("applications", populate=POPULATE["applications"]):
            email = truncate(entity.get("email") or "", 200)
            name = truncate(entity.get("name") or entity.get("first_name") or "", 120)
            if not email or not name:
                local.skipped += 1
                continue
            resume_key = ctx.media.import_field(entity.get("resume") or entity.get("cv"))
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            opening_rels = relation_list(entity.get("opening") or entity.get("openings"))
            if ctx.dry_run:
                local.created += 1
                continue
            existing = (
                ctx.db.query(Application)
                .filter(Application.email == email, Application.name == name)
                .order_by(Application.created_at.desc())
                .first()
            )
            fields = dict(
                resume_key=resume_key,
                name=name,
                last_name=truncate(entity.get("last_name") or "", 120),
                email=email,
                phone=truncate(entity.get("phone") or "", 40),
                opened=as_bool(entity.get("opened")),
                current_ctc=as_float(entity.get("current_ctc")),
                expected_ctc=as_float(entity.get("expected_ctc")),
                notice_period=as_float(entity.get("notice_period")),
                experience=as_float(entity.get("experience")),
                additional_info=as_text(entity.get("additional_info")),
                status=status,
            )
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                row = existing
                row.opening_links.clear()
                local.updated += 1
            else:
                row = Application(id=uuid4(), created_at=created_at, **fields)
                ctx.db.add(row)
                ctx.db.flush()
                local.created += 1
            for opening in opening_rels:
                opening_id = ctx.id_map.get("openings", opening.get("id"))
                if opening_id is None:
                    slug = ensure_slug(opening.get("slug"), as_text(opening.get("role") or "job"))
                    opening_row = ctx.db.query(Opening).filter(Opening.slug == slug).first()
                    opening_id = opening_row.id if opening_row else None
                if opening_id:
                    row.opening_links.append(
                        OpeningApplication(opening_id=opening_id, application_id=row.id)
                    )
            ctx.id_map.set("applications", entity.get("id"), row.id)
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("applications", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_downloads(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("downloads", populate=POPULATE["downloads"]):
            name = truncate(entity.get("name") or entity.get("file_name") or "Download", 200)
            file_key = ctx.media.import_field(
                entity.get("file") or entity.get("pdf") or entity.get("document")
            )
            if not file_key:
                local.skipped += 1
                continue
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            if ctx.dry_run:
                local.created += 1
                continue
            existing = (
                ctx.db.query(Download)
                .filter(Download.name == name, Download.file_key == file_key)
                .first()
            )
            if existing:
                existing.company = truncate(entity.get("company") or "", 200)
                existing.status = status
                ctx.id_map.set("downloads", entity.get("id"), existing.id)
                local.updated += 1
            else:
                row = Download(
                    id=uuid4(),
                    name=name,
                    company=truncate(entity.get("company") or "", 200),
                    file_key=file_key,
                    status=status,
                    created_at=created_at,
                )
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("downloads", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("downloads", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_memberships(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("awards", populate=POPULATE["awards"]):
            title = truncate(entity.get("title") or entity.get("name") or "Membership", 200)
            description = as_text(entity.get("description"))
            if isinstance(entity.get("description"), list):
                description = ctx.body_html(entity.get("description"))
            images: list[str] = []
            for block in relation_list(entity.get("images")):
                key = ctx.media.import_field(block.get("image") or block)
                if key:
                    images.append(key)
            # Also accept direct media multi
            if not images:
                images = ctx.media.import_many(entity.get("images"))
            seo = map_seo(entity.get("seo"))
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            if ctx.dry_run:
                local.created += 1
                continue
            existing = ctx.db.query(Membership).filter(Membership.title == title).first()
            if existing:
                existing.description = description
                existing.images = images
                existing.seo = seo
                existing.status = status
                ctx.id_map.set("awards", entity.get("id"), existing.id)
                local.updated += 1
            else:
                row = Membership(
                    id=uuid4(),
                    title=title,
                    description=description,
                    images=images,
                    seo=seo,
                    status=status,
                    created_at=created_at,
                )
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("awards", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("awards", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_contacts(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("contacts", populate=POPULATE["contacts"]):
            email = truncate(entity.get("email") or "", 200)
            name = truncate(entity.get("name") or entity.get("first_name") or "", 120)
            if not email:
                local.skipped += 1
                continue
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            if ctx.dry_run:
                local.created += 1
                continue
            existing = (
                ctx.db.query(Contact)
                .filter(
                    Contact.email == email,
                    Contact.name == name,
                    Contact.subject == truncate(entity.get("subject") or "", 200),
                )
                .first()
            )
            fields = dict(
                name=name or "Contact",
                last_name=truncate(entity.get("last_name") or "", 120),
                email=email,
                country=truncate(entity.get("country") or "", 120),
                phone=truncate(entity.get("phone") or "", 40),
                subject=truncate(entity.get("subject") or "", 200),
                contact_date=parse_date(entity.get("contact_date") or entity.get("createdAt")),
                details=as_text(entity.get("details") or entity.get("message")),
                contact_type=truncate(entity.get("contact_type") or entity.get("type") or "", 120),
                company_name=truncate(
                    entity.get("company_name") or entity.get("company") or "", 200
                ),
                status=status,
            )
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                ctx.id_map.set("contacts", entity.get("id"), existing.id)
                local.updated += 1
            else:
                row = Contact(id=uuid4(), created_at=created_at, **fields)
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("contacts", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("contacts", str(exc))
    before.merge(local)
    ctx.stats = before
    return local


def import_subscriptions(ctx: ImportContext) -> ImportStats:
    local = ImportStats()
    before = ctx.stats
    ctx.stats = local
    try:
        for entity in ctx.client.list_all("subscriptions", populate=POPULATE["subscriptions"]):
            email = truncate(entity.get("email") or "", 200)
            if not email:
                local.skipped += 1
                continue
            status = content_status(entity)
            created_at = parse_datetime(entity.get("createdAt"))
            active = as_bool(entity.get("active"), default=True)
            if ctx.dry_run:
                existing = ctx.db.query(Subscription).filter(Subscription.email == email).first()
                if existing:
                    local_inc_updated(ctx)
                else:
                    local_inc_created(ctx)
                continue
            existing = ctx.db.query(Subscription).filter(Subscription.email == email).first()
            if existing:
                existing.active = active
                existing.status = status
                ctx.id_map.set("subscriptions", entity.get("id"), existing.id)
                local.updated += 1
            else:
                row = Subscription(
                    id=uuid4(),
                    email=email,
                    active=active,
                    status=status,
                    created_at=created_at,
                )
                ctx.db.add(row)
                ctx.db.flush()
                ctx.id_map.set("subscriptions", entity.get("id"), row.id)
                local.created += 1
    except Exception as exc:  # noqa: BLE001
        ctx.record_error("subscriptions", str(exc))
    before.merge(local)
    ctx.stats = before
    return local
