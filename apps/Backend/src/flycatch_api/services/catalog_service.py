from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from flycatch_api.models import Author
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.catalog import (
    Application as ApplicationRow,
    Contact as ContactRow,
    Download as DownloadRow,
    EmailConfiguration as EmailConfigurationRow,
    EmailTemplate as EmailTemplateRow,
    EmployeeTestimonial as EmployeeTestimonialRow,
    FlycatchSaudiArabia as FlycatchSaudiArabiaRow,
    Membership as MembershipRow,
    News as NewsRow,
    NewsAuthorLink,
    NewsCategory as NewsCategoryRow,
    NewsCategoryLink,
    Opening as OpeningRow,
    OpeningApplication,
    Resource as ResourceRow,
    ResourceCategory as ResourceCategoryRow,
    ResourceCategoryLink,
    Subscription as SubscriptionRow,
)
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_blogs import EntityNotFound
from flycatch_api.schemas.admin_catalog import (
    Application,
    ApplicationList,
    ApplicationSummary,
    ApplicationWrite,
    EmailConfiguration,
    EmailConfigurationList,
    EmailConfigurationSummary,
    EmailConfigurationWrite,
    EmailTemplate,
    EmailTemplateList,
    EmailTemplateSummary,
    EmailTemplateWrite,
    EmployeeTestimonial,
    EmployeeTestimonialList,
    EmployeeTestimonialSummary,
    EmployeeTestimonialWrite,
    Contact,
    ContactList,
    ContactSummary,
    ContactWrite,
    Download,
    DownloadList,
    DownloadSummary,
    DownloadWrite,
    FlycatchSaudiArabia,
    FlycatchSaudiArabiaList,
    FlycatchSaudiArabiaSummary,
    FlycatchSaudiArabiaWrite,
    Membership,
    MembershipImage,
    MembershipList,
    MembershipSummary,
    MembershipWrite,
    ServiceSectionItem,
    Subscription,
    SubscriptionList,
    SubscriptionSummary,
    SubscriptionWrite,
    NestedAuthor,
    News,
    NewsCategory,
    NewsCategoryList,
    NewsCategorySummary,
    NewsCategoryWrite,
    NewsList,
    NewsSummary,
    NewsWrite,
    Opening,
    OpeningList,
    OpeningSummary,
    OpeningWrite,
    Resource,
    ResourceList,
    ResourceSummary,
    ResourceWrite,
    ResourcesCategory,
    ResourcesCategoryList,
    ResourcesCategorySummary,
    ResourcesCategoryWrite,
)
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.public_catalog import (
    PublicApplication,
    PublicApplicationList,
    PublicAuthor,
    PublicEmailConfiguration,
    PublicEmailConfigurationList,
    PublicEmailTemplate,
    PublicEmailTemplateList,
    PublicEmployeeTestimonial,
    PublicEmployeeTestimonialList,
    PublicContact,
    PublicContactList,
    PublicDownload,
    PublicDownloadList,
    PublicFlycatchSaudiArabia,
    PublicFlycatchSaudiArabiaList,
    PublicMembership,
    PublicMembershipList,
    PublicServiceSectionItem,
    PublicSubscription,
    PublicSubscriptionList,
    PublicNews,
    PublicNewsCategory,
    PublicNewsCategoryList,
    PublicNewsList,
    PublicOpening,
    PublicOpeningList,
    PublicResource,
    PublicResourceCategory,
    PublicResourceList,
    PublicResourcesCategory,
    PublicResourcesCategoryList,
    MembershipImage as PublicMembershipImage,
)
from flycatch_api.services.author_service import CatalogError, author_schema
from flycatch_api.services.content_blocks import optional_key, seo_dict
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.landing_catalog import seo_snippet
from flycatch_api.services.text import document_format, is_valid_media_key, is_valid_slug, sanitize_html, slugify

LOCATIONS = {"Kochi", "Saudi Arabia", "Hybrid", "Remote"}
JOB_TYPES = {"Full-Time", "Part-Time", "Contract"}
JOB_STATUSES = {"Opening Soon", "Ongoing"}
SPECIALIZATIONS = {
    "Frontend",
    "Backend",
    "DevOps",
    "Testing",
    "BDE",
    "CMS",
    "FullStack",
    "UI/UX",
    "IT Recruiter",
}
TEMPLATE_TYPES = {"user_notification", "admin_notification"}


def _required(value: str, field: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        raise CatalogError(
            422,
            FieldErrors(fields={field: FieldErrorDetail(message_key="admin.field.required")}).model_dump(),
        )
    return trimmed


def _not_found(key: str) -> CatalogError:
    return CatalogError(404, EntityNotFound(message_key=key).model_dump())


def _paginate(query, page: int, per_page: int):
    page = max(page, 1)
    per_page = min(max(per_page, 1), PER_PAGE)
    total = query.count()
    rows = query.offset((page - 1) * per_page).limit(per_page).all()
    return page, per_page, rows, total


def _unique_slug(db: Session, model, slug: str, current_id: UUID | None, field: str, invalid_key: str, dup_key: str) -> str:
    if not is_valid_slug(slug):
        raise CatalogError(
            422,
            FieldErrors(fields={field: FieldErrorDetail(message_key=invalid_key)}).model_dump(),
        )
    existing = db.query(model).filter(func.lower(model.slug) == slug.lower()).first()
    if existing is not None and existing.id != current_id:
        raise CatalogError(
            422,
            FieldErrors(fields={field: FieldErrorDetail(message_key=dup_key)}).model_dump(),
        )
    return slug


def _opening_label(row: OpeningRow) -> str:
    return row.job_id or row.role


def _openings_label(row: ApplicationRow) -> str:
    return ", ".join(_opening_label(link.opening) for link in row.opening_links if link.opening)


def application_schema(row: ApplicationRow) -> Application:
    return Application(
        id=row.id,
        resume_key=row.resume_key,
        resume_format=document_format(row.resume_key),
        name=row.name,
        last_name=row.last_name,
        email=row.email,
        phone=row.phone,
        opened=row.opened,
        current_ctc=row.current_ctc,
        expected_ctc=row.expected_ctc,
        notice_period=row.notice_period,
        experience=row.experience,
        additional_info=row.additional_info,
        openings=_openings_label(row),
        status=row.status,
        created_at=row.created_at,
    )


def public_application(row: ApplicationRow) -> PublicApplication:
    return PublicApplication(
        id=row.id,
        resume_key=row.resume_key,
        resume_format=document_format(row.resume_key),
        name=row.name,
        last_name=row.last_name,
        email=row.email,
        phone=row.phone,
        opened=row.opened,
        current_ctc=row.current_ctc,
        expected_ctc=row.expected_ctc,
        notice_period=row.notice_period,
        experience=row.experience,
        additional_info=row.additional_info,
        openings=_openings_label(row),
    )


class ApplicationService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> ApplicationList:
        query = db.query(ApplicationRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    ApplicationRow.name.ilike(term),
                    ApplicationRow.last_name.ilike(term),
                    ApplicationRow.email.ilike(term),
                )
            )
        page, per_page, rows, total = _paginate(
            query.order_by(ApplicationRow.created_at.desc()), page, per_page
        )
        return ApplicationList(
            items=[
                ApplicationSummary(
                    id=row.id,
                    openings=_openings_label(row),
                    resume_format=document_format(row.resume_key),
                    name=row.name,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicApplicationList:
        query = db.query(ApplicationRow).filter(ApplicationRow.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(ApplicationRow.name.ilike(term), ApplicationRow.email.ilike(term)))
        page, per_page, rows, total = _paginate(
            query.order_by(ApplicationRow.created_at.desc()), page, per_page
        )
        return PublicApplicationList(
            items=[public_application(row) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get(self, db: Session, item_id: UUID) -> Application:
        row = db.get(ApplicationRow, item_id)
        if row is None:
            raise _not_found("admin.applications.not_found")
        return application_schema(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicApplication:
        row = db.get(ApplicationRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.applications.not_found")
        return public_application(row)

    def create(self, db: Session, payload: ApplicationWrite) -> Application:
        row = ApplicationRow(created_at=datetime.now(UTC))
        self._apply(row, payload)
        db.add(row)
        db.commit()
        db.refresh(row)
        return application_schema(row)

    def update(self, db: Session, item_id: UUID, payload: ApplicationWrite) -> Application:
        row = db.get(ApplicationRow, item_id)
        if row is None:
            raise _not_found("admin.applications.not_found")
        self._apply(row, payload)
        db.commit()
        db.refresh(row)
        return application_schema(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(ApplicationRow, item_id)
        if row is None:
            raise _not_found("admin.applications.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, row: ApplicationRow, payload: ApplicationWrite) -> None:
        row.resume_key = payload.resume_key or None
        row.name = _required(payload.name, "name")
        row.last_name = _required(payload.last_name, "last_name")
        row.email = str(payload.email)
        row.phone = payload.phone.strip()
        row.opened = payload.opened
        row.current_ctc = payload.current_ctc
        row.expected_ctc = payload.expected_ctc
        row.notice_period = payload.notice_period
        row.experience = payload.experience
        row.additional_info = payload.additional_info.strip()
        row.status = coerce_status(payload.status)


class OpeningService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> OpeningList:
        query = db.query(OpeningRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(OpeningRow.job_id.ilike(term), OpeningRow.role.ilike(term), OpeningRow.slug.ilike(term))
            )
        page, per_page, rows, total = _paginate(query.order_by(OpeningRow.created_at.desc()), page, per_page)
        return OpeningList(
            items=[
                OpeningSummary(
                    id=row.id,
                    job_id=row.job_id,
                    exp_date=row.exp_date,
                    role=row.role,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicOpeningList:
        query = (
            db.query(OpeningRow)
            .options(joinedload(OpeningRow.application_links).joinedload(OpeningApplication.application))
            .filter(OpeningRow.status == ContentStatus.publish)
        )
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(OpeningRow.job_id.ilike(term), OpeningRow.role.ilike(term)))
        page, per_page, rows, total = _paginate(query.order_by(OpeningRow.created_at.desc()), page, per_page)
        return PublicOpeningList(
            items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total
        )

    def get(self, db: Session, item_id: UUID) -> Opening:
        row = self._load(db, item_id)
        return self._detail(row)

    def get_published_by_slug(self, db: Session, slug: str) -> PublicOpening:
        row = (
            db.query(OpeningRow)
            .options(joinedload(OpeningRow.application_links).joinedload(OpeningApplication.application))
            .filter(func.lower(OpeningRow.slug) == slug.strip().lower(), OpeningRow.status == ContentStatus.publish)
            .first()
        )
        if row is None:
            raise _not_found("public.openings.not_found")
        return self._public(row)

    def create(self, db: Session, payload: OpeningWrite) -> Opening:
        row = OpeningRow(created_at=datetime.now(UTC))
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return self.get(db, row.id)

    def update(self, db: Session, item_id: UUID, payload: OpeningWrite) -> Opening:
        row = self._load(db, item_id)
        self._apply(db, row, payload, row.id)
        db.commit()
        return self.get(db, row.id)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(OpeningRow, item_id)
        if row is None:
            raise _not_found("admin.openings.not_found")
        db.delete(row)
        db.commit()

    def _load(self, db: Session, item_id: UUID) -> OpeningRow:
        row = (
            db.query(OpeningRow)
            .options(joinedload(OpeningRow.application_links).joinedload(OpeningApplication.application))
            .filter(OpeningRow.id == item_id)
            .first()
        )
        if row is None:
            raise _not_found("admin.openings.not_found")
        return row

    def _apply(self, db: Session, row: OpeningRow, payload: OpeningWrite, current_id: UUID | None) -> None:
        if payload.location not in LOCATIONS:
            raise CatalogError(
                422,
                FieldErrors(fields={"location": FieldErrorDetail(message_key="admin.field.required")}).model_dump(),
            )
        slug = slugify(payload.slug) or slugify(payload.role)
        row.job_id = _required(payload.job_id, "job_id")
        row.exp_date = payload.exp_date
        row.role = _required(payload.role, "role")
        row.slug = _unique_slug(
            db, OpeningRow, slug, current_id, "slug", "admin.openings.slug.invalid", "admin.openings.slug.duplicate"
        )
        row.experience = payload.experience.strip()
        row.location = payload.location
        row.job_type = payload.job_type
        row.job_status = payload.job_status
        row.specialization = payload.specialization
        row.body = sanitize_html(payload.body)
        row.status = coerce_status(payload.status)
        apps = self._applications(db, payload.application_ids)
        row.application_links = [OpeningApplication(application=item) for item in apps]

    def _applications(self, db: Session, ids: list[UUID]) -> list[ApplicationRow]:
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(ApplicationRow).filter(ApplicationRow.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"application_ids": FieldErrorDetail(message_key="admin.openings.applications.invalid")}
                ).model_dump(),
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _detail(self, row: OpeningRow) -> Opening:
        apps = [application_schema(link.application) for link in row.application_links if link.application]
        return Opening(
            id=row.id,
            job_id=row.job_id,
            exp_date=row.exp_date,
            role=row.role,
            slug=row.slug,
            experience=row.experience,
            location=row.location,  # type: ignore[arg-type]
            job_type=row.job_type,  # type: ignore[arg-type]
            job_status=row.job_status,  # type: ignore[arg-type]
            specialization=row.specialization,  # type: ignore[arg-type]
            body=row.body,
            application_ids=[item.id for item in apps],
            applications=apps,
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: OpeningRow) -> PublicOpening:
        return PublicOpening(
            job_id=row.job_id,
            exp_date=row.exp_date,
            role=row.role,
            slug=row.slug,
            experience=row.experience,
            location=row.location,
            job_type=row.job_type,
            job_status=row.job_status,
            specialization=row.specialization,
            body=row.body,
            applications=[
                public_application(link.application) for link in row.application_links if link.application
            ],
        )


class NamedCatalogService:
    def __init__(self, model, schema, summary, list_model, write_model, public_model, public_list, admin_key, public_key, public_item):
        self.model = model
        self.schema = schema
        self.summary = summary
        self.list_model = list_model
        self.write_model = write_model
        self.public_model = public_model
        self.public_list = public_list
        self.admin_key = admin_key
        self.public_key = public_key
        self.public_item = public_item

    def list_items(self, db: Session, q: str | None, page: int, per_page: int):
        query = db.query(self.model)
        if q and q.strip():
            query = query.filter(self.model.name.ilike(f"%{q.strip()}%"))
        page, per_page, rows, total = _paginate(query.order_by(self.model.created_at.desc()), page, per_page)
        return self.list_model(
            items=[self.summary(id=row.id, name=row.name, state=row.status) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int):
        query = db.query(self.model).filter(self.model.status == ContentStatus.publish)
        if q and q.strip():
            query = query.filter(self.model.name.ilike(f"%{q.strip()}%"))
        page, per_page, rows, total = _paginate(query.order_by(self.model.name.asc()), page, per_page)
        return self.public_list(
            items=[self.public_item(id=row.id, name=row.name) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get(self, db: Session, item_id: UUID):
        row = db.get(self.model, item_id)
        if row is None:
            raise _not_found(self.admin_key)
        return self.schema(id=row.id, name=row.name, status=row.status, created_at=row.created_at)

    def get_published(self, db: Session, item_id: UUID):
        row = db.get(self.model, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found(self.public_key)
        return self.public_item(id=row.id, name=row.name)

    def create(self, db: Session, payload):
        row = self.model(
            name=_required(payload.name, "name"),
            status=coerce_status(payload.status),
            created_at=datetime.now(UTC),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return self.get(db, row.id)

    def update(self, db: Session, item_id: UUID, payload):
        row = db.get(self.model, item_id)
        if row is None:
            raise _not_found(self.admin_key)
        row.name = _required(payload.name, "name")
        row.status = coerce_status(payload.status)
        db.commit()
        return self.get(db, row.id)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(self.model, item_id)
        if row is None:
            raise _not_found(self.admin_key)
        db.delete(row)
        db.commit()


news_category_service = NamedCatalogService(
    NewsCategoryRow,
    NewsCategory,
    NewsCategorySummary,
    NewsCategoryList,
    NewsCategoryWrite,
    PublicNewsCategory,
    PublicNewsCategoryList,
    "admin.news_categories.not_found",
    "public.news_categories.not_found",
    PublicNewsCategory,
)
resource_category_service = NamedCatalogService(
    ResourceCategoryRow,
    ResourcesCategory,
    ResourcesCategorySummary,
    ResourcesCategoryList,
    ResourcesCategoryWrite,
    PublicResourcesCategory,
    PublicResourcesCategoryList,
    "admin.resource_categories.not_found",
    "public.resource_categories.not_found",
    PublicResourcesCategory,
)


class EmployeeTestimonialService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> EmployeeTestimonialList:
        query = db.query(EmployeeTestimonialRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    EmployeeTestimonialRow.name.ilike(term),
                    EmployeeTestimonialRow.designation.ilike(term),
                    EmployeeTestimonialRow.review.ilike(term),
                )
            )
        page, per_page, rows, total = _paginate(
            query.order_by(EmployeeTestimonialRow.sort_order.asc(), EmployeeTestimonialRow.created_at.desc()),
            page,
            per_page,
        )
        return EmployeeTestimonialList(
            items=[
                EmployeeTestimonialSummary(
                    id=row.id,
                    name=row.name,
                    designation=row.designation,
                    image_key=row.image_key,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicEmployeeTestimonialList:
        query = db.query(EmployeeTestimonialRow).filter(EmployeeTestimonialRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(
            query.order_by(EmployeeTestimonialRow.sort_order.asc()), page, per_page
        )
        return PublicEmployeeTestimonialList(
            items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total
        )

    def get(self, db: Session, item_id: UUID) -> EmployeeTestimonial:
        row = db.get(EmployeeTestimonialRow, item_id)
        if row is None:
            raise _not_found("admin.employee_testimonials.not_found")
        return self._detail(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicEmployeeTestimonial:
        row = db.get(EmployeeTestimonialRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.employee_testimonials.not_found")
        return self._public(row)

    def create(self, db: Session, payload: EmployeeTestimonialWrite) -> EmployeeTestimonial:
        row = EmployeeTestimonialRow(created_at=datetime.now(UTC))
        self._apply(row, payload)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: EmployeeTestimonialWrite) -> EmployeeTestimonial:
        row = db.get(EmployeeTestimonialRow, item_id)
        if row is None:
            raise _not_found("admin.employee_testimonials.not_found")
        self._apply(row, payload)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(EmployeeTestimonialRow, item_id)
        if row is None:
            raise _not_found("admin.employee_testimonials.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, row: EmployeeTestimonialRow, payload: EmployeeTestimonialWrite) -> None:
        row.name = _required(payload.name, "name")
        row.designation = payload.designation.strip()
        row.review = _required(payload.review, "review")
        row.image_key = payload.image_key or None
        row.sort_order = payload.order
        row.listed = payload.listed
        row.publish_date = payload.publish_date
        row.status = coerce_status(payload.status)

    def _detail(self, row: EmployeeTestimonialRow) -> EmployeeTestimonial:
        return EmployeeTestimonial(
            id=row.id,
            name=row.name,
            designation=row.designation,
            review=row.review,
            image_key=row.image_key,
            order=row.sort_order,
            listed=row.listed,
            publish_date=row.publish_date,
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: EmployeeTestimonialRow) -> PublicEmployeeTestimonial:
        return PublicEmployeeTestimonial(
            id=row.id,
            name=row.name,
            designation=row.designation,
            review=row.review,
            image_key=row.image_key,
            order=row.sort_order,
            listed=row.listed,
            publish_date=row.publish_date,
        )


class EmailConfigurationService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> EmailConfigurationList:
        query = db.query(EmailConfigurationRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    EmailConfigurationRow.smtp_default_from.ilike(term),
                    EmailConfigurationRow.smtp_default_reply_to.ilike(term),
                    EmailConfigurationRow.smtp_admin_email.ilike(term),
                )
            )
        page, per_page, rows, total = _paginate(
            query.order_by(EmailConfigurationRow.created_at.desc()), page, per_page
        )
        return EmailConfigurationList(
            items=[
                EmailConfigurationSummary(
                    id=row.id,
                    smtp_default_from=row.smtp_default_from,
                    smtp_default_reply_to=row.smtp_default_reply_to,
                    smtp_admin_email=row.smtp_admin_email,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicEmailConfigurationList:
        query = db.query(EmailConfigurationRow).filter(EmailConfigurationRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(query.order_by(EmailConfigurationRow.created_at.desc()), page, per_page)
        return PublicEmailConfigurationList(
            items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total
        )

    def get(self, db: Session, item_id: UUID) -> EmailConfiguration:
        row = db.get(EmailConfigurationRow, item_id)
        if row is None:
            raise _not_found("admin.email_configuration.not_found")
        return self._detail(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicEmailConfiguration:
        row = db.get(EmailConfigurationRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.email_configuration.not_found")
        return self._public(row)

    def create(self, db: Session, payload: EmailConfigurationWrite) -> EmailConfiguration:
        row = EmailConfigurationRow(created_at=datetime.now(UTC))
        self._apply(row, payload)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: EmailConfigurationWrite) -> EmailConfiguration:
        row = db.get(EmailConfigurationRow, item_id)
        if row is None:
            raise _not_found("admin.email_configuration.not_found")
        self._apply(row, payload)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(EmailConfigurationRow, item_id)
        if row is None:
            raise _not_found("admin.email_configuration.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, row: EmailConfigurationRow, payload: EmailConfigurationWrite) -> None:
        row.smtp_default_from = str(payload.smtp_default_from)
        row.smtp_default_reply_to = str(payload.smtp_default_reply_to)
        row.smtp_admin_email = str(payload.smtp_admin_email)
        row.status = coerce_status(payload.status)

    def _detail(self, row: EmailConfigurationRow) -> EmailConfiguration:
        return EmailConfiguration(
            id=row.id,
            smtp_default_from=row.smtp_default_from,
            smtp_default_reply_to=row.smtp_default_reply_to,
            smtp_admin_email=row.smtp_admin_email,
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: EmailConfigurationRow) -> PublicEmailConfiguration:
        return PublicEmailConfiguration(
            id=row.id,
            smtp_default_from=row.smtp_default_from,
            smtp_default_reply_to=row.smtp_default_reply_to,
            smtp_admin_email=row.smtp_admin_email,
        )


class EmailTemplateService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> EmailTemplateList:
        query = db.query(EmailTemplateRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    EmailTemplateRow.slug.ilike(term),
                    EmailTemplateRow.subject.ilike(term),
                    EmailTemplateRow.template_type.ilike(term),
                )
            )
        page, per_page, rows, total = _paginate(query.order_by(EmailTemplateRow.created_at.desc()), page, per_page)
        return EmailTemplateList(
            items=[
                EmailTemplateSummary(
                    id=row.id, slug=row.slug, type=row.template_type, subject=row.subject, state=row.status
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicEmailTemplateList:
        query = db.query(EmailTemplateRow).filter(EmailTemplateRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(query.order_by(EmailTemplateRow.slug.asc()), page, per_page)
        return PublicEmailTemplateList(
            items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total
        )

    def get(self, db: Session, item_id: UUID) -> EmailTemplate:
        row = db.get(EmailTemplateRow, item_id)
        if row is None:
            raise _not_found("admin.email_templates.not_found")
        return self._detail(row)

    def get_published_by_slug(self, db: Session, slug: str) -> PublicEmailTemplate:
        row = (
            db.query(EmailTemplateRow)
            .filter(func.lower(EmailTemplateRow.slug) == slug.strip().lower(), EmailTemplateRow.status == ContentStatus.publish)
            .first()
        )
        if row is None:
            raise _not_found("public.email_templates.not_found")
        return self._public(row)

    def create(self, db: Session, payload: EmailTemplateWrite) -> EmailTemplate:
        row = EmailTemplateRow(created_at=datetime.now(UTC))
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: EmailTemplateWrite) -> EmailTemplate:
        row = db.get(EmailTemplateRow, item_id)
        if row is None:
            raise _not_found("admin.email_templates.not_found")
        self._apply(db, row, payload, row.id)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(EmailTemplateRow, item_id)
        if row is None:
            raise _not_found("admin.email_templates.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, db: Session, row: EmailTemplateRow, payload: EmailTemplateWrite, current_id: UUID | None) -> None:
        slug = slugify(payload.slug) or slugify(payload.subject)
        row.body = sanitize_html(payload.body)
        row.slug = _unique_slug(
            db,
            EmailTemplateRow,
            slug,
            current_id,
            "slug",
            "admin.email_templates.slug.invalid",
            "admin.email_templates.slug.duplicate",
        )
        row.template_type = payload.type
        row.subject = _required(payload.subject, "subject")
        row.status = coerce_status(payload.status)

    def _detail(self, row: EmailTemplateRow) -> EmailTemplate:
        return EmailTemplate(
            id=row.id,
            body=row.body,
            slug=row.slug,
            type=row.template_type,  # type: ignore[arg-type]
            subject=row.subject,
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: EmailTemplateRow) -> PublicEmailTemplate:
        return PublicEmailTemplate(slug=row.slug, type=row.template_type, subject=row.subject, body=row.body)


class NewsService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> NewsList:
        query = db.query(NewsRow).options(joinedload(NewsRow.category_links).joinedload(NewsCategoryLink.category))
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(NewsRow.title.ilike(term), NewsRow.slug.ilike(term), NewsRow.description.ilike(term)))
        page, per_page, rows, total = _paginate(query.order_by(NewsRow.created_at.desc()), page, per_page)
        return NewsList(items=[self._summary(row) for row in rows], page=page, per_page=per_page, total=total)

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicNewsList:
        query = (
            db.query(NewsRow)
            .options(
                joinedload(NewsRow.category_links).joinedload(NewsCategoryLink.category),
                joinedload(NewsRow.author_links).joinedload(NewsAuthorLink.author),
            )
            .filter(NewsRow.status == ContentStatus.publish)
        )
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(NewsRow.title.ilike(term), NewsRow.slug.ilike(term)))
        page, per_page, rows, total = _paginate(query.order_by(NewsRow.created_at.desc()), page, per_page)
        return PublicNewsList(items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total)

    def get(self, db: Session, item_id: UUID) -> News:
        return self._detail(self._load(db, item_id))

    def get_published_by_slug(self, db: Session, slug: str) -> PublicNews:
        row = (
            db.query(NewsRow)
            .options(
                joinedload(NewsRow.category_links).joinedload(NewsCategoryLink.category),
                joinedload(NewsRow.author_links).joinedload(NewsAuthorLink.author),
            )
            .filter(func.lower(NewsRow.slug) == slug.strip().lower(), NewsRow.status == ContentStatus.publish)
            .first()
        )
        if row is None:
            raise _not_found("public.news.not_found")
        return self._public(row)

    def create(self, db: Session, payload: NewsWrite) -> News:
        now = datetime.now(UTC)
        row = NewsRow(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return self.get(db, row.id)

    def update(self, db: Session, item_id: UUID, payload: NewsWrite) -> News:
        row = self._load(db, item_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return self.get(db, row.id)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(NewsRow, item_id)
        if row is None:
            raise _not_found("admin.news.not_found")
        db.delete(row)
        db.commit()

    def _load(self, db: Session, item_id: UUID) -> NewsRow:
        row = (
            db.query(NewsRow)
            .options(
                joinedload(NewsRow.category_links).joinedload(NewsCategoryLink.category),
                joinedload(NewsRow.author_links).joinedload(NewsAuthorLink.author),
            )
            .filter(NewsRow.id == item_id)
            .first()
        )
        if row is None:
            raise _not_found("admin.news.not_found")
        return row

    def _apply(self, db: Session, row: NewsRow, payload: NewsWrite, current_id: UUID | None) -> None:
        title = _required(payload.title, "title")
        slug = slugify(payload.slug) or slugify(title)
        row.title = title
        row.slug = _unique_slug(db, NewsRow, slug, current_id, "slug", "admin.news.slug.invalid", "admin.news.slug.duplicate")
        row.body = sanitize_html(payload.body)
        row.image_key = payload.image_key or None
        row.description = payload.description.strip()
        row.button_name = payload.button_name.strip()
        row.reading_time = payload.reading_time
        row.facebook = payload.facebook.strip()
        row.linkedin = payload.linkedin.strip()
        row.twitter = payload.twitter.strip()
        row.instagram = payload.instagram.strip()
        row.youtube_url = payload.youtube_url.strip()
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)
        categories = self._load_ids(db, NewsCategoryRow, payload.news_category_ids, "news_category_ids", "admin.news.categories.invalid")
        authors = self._load_ids(db, Author, payload.author_ids, "author_ids", "admin.news.authors.invalid")
        row.category_links = [NewsCategoryLink(category=item) for item in categories]
        row.author_links = [NewsAuthorLink(author=item) for item in authors]

    def _load_ids(self, db: Session, model, ids: list[UUID], field: str, key: str):
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(model).filter(model.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422, FieldErrors(fields={field: FieldErrorDetail(message_key=key)}).model_dump()
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _summary(self, row: NewsRow) -> NewsSummary:
        names = [link.category.name for link in row.category_links if link.category]
        return NewsSummary(
            id=row.id,
            seo=seo_snippet(row.seo),
            slug=row.slug,
            news_categories=len(names),
            news_category_names=names,
            state=row.status,
        )

    def _detail(self, row: NewsRow) -> News:
        categories = [
            NewsCategory(id=link.category.id, name=link.category.name, status=link.category.status, created_at=link.category.created_at)
            for link in row.category_links
            if link.category
        ]
        authors = [NestedAuthor(**author_schema(link.author).model_dump()) for link in row.author_links if link.author]
        return News(
            id=row.id,
            title=row.title,
            slug=row.slug,
            body=row.body,
            news_category_ids=[item.id for item in categories],
            news_categories=categories,
            author_ids=[item.id for item in authors],
            authors=authors,
            image_key=row.image_key,
            description=row.description,
            button_name=row.button_name,
            reading_time=row.reading_time,
            facebook=row.facebook,
            linkedin=row.linkedin,
            twitter=row.twitter,
            instagram=row.instagram,
            youtube_url=row.youtube_url,
            seo=ContentSeo.model_validate(row.seo or {}),
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: NewsRow) -> PublicNews:
        return PublicNews(
            title=row.title,
            slug=row.slug,
            body=row.body,
            news_categories=[PublicNewsCategory(name=link.category.name) for link in row.category_links if link.category],
            authors=[
                PublicAuthor(
                    name=link.author.name,
                    bio=link.author.bio or "",
                    designation=link.author.designation or "",
                    writer_image_keys=list(link.author.writer_image_keys or []),
                )
                for link in row.author_links
                if link.author
            ],
            image_key=row.image_key,
            description=row.description,
            button_name=row.button_name,
            reading_time=row.reading_time,
            facebook=row.facebook,
            linkedin=row.linkedin,
            twitter=row.twitter,
            instagram=row.instagram,
            youtube_url=row.youtube_url,
            seo=ContentSeo.model_validate(row.seo or {}),
        )


class ResourceService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> ResourceList:
        query = db.query(ResourceRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(ResourceRow.title.ilike(term), ResourceRow.slug.ilike(term)))
        page, per_page, rows, total = _paginate(query.order_by(ResourceRow.created_at.desc()), page, per_page)
        return ResourceList(items=[self._summary(row) for row in rows], page=page, per_page=per_page, total=total)

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicResourceList:
        query = (
            db.query(ResourceRow)
            .options(joinedload(ResourceRow.category_links).joinedload(ResourceCategoryLink.category))
            .filter(ResourceRow.status == ContentStatus.publish)
        )
        if q and q.strip():
            query = query.filter(ResourceRow.title.ilike(f"%{q.strip()}%"))
        page, per_page, rows, total = _paginate(query.order_by(ResourceRow.created_at.desc()), page, per_page)
        return PublicResourceList(items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total)

    def get(self, db: Session, item_id: UUID) -> Resource:
        return self._detail(self._load(db, item_id))

    def get_published_by_slug(self, db: Session, slug: str) -> PublicResource:
        row = (
            db.query(ResourceRow)
            .options(joinedload(ResourceRow.category_links).joinedload(ResourceCategoryLink.category))
            .filter(func.lower(ResourceRow.slug) == slug.strip().lower(), ResourceRow.status == ContentStatus.publish)
            .first()
        )
        if row is None:
            raise _not_found("public.resources.not_found")
        return self._public(row)

    def create(self, db: Session, payload: ResourceWrite) -> Resource:
        now = datetime.now(UTC)
        row = ResourceRow(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return self.get(db, row.id)

    def update(self, db: Session, item_id: UUID, payload: ResourceWrite) -> Resource:
        row = self._load(db, item_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return self.get(db, row.id)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(ResourceRow, item_id)
        if row is None:
            raise _not_found("admin.resources.not_found")
        db.delete(row)
        db.commit()

    def _load(self, db: Session, item_id: UUID) -> ResourceRow:
        row = (
            db.query(ResourceRow)
            .options(joinedload(ResourceRow.category_links).joinedload(ResourceCategoryLink.category))
            .filter(ResourceRow.id == item_id)
            .first()
        )
        if row is None:
            raise _not_found("admin.resources.not_found")
        return row

    def _apply(self, db: Session, row: ResourceRow, payload: ResourceWrite, current_id: UUID | None) -> None:
        title = _required(payload.title, "title")
        slug = slugify(payload.slug) or slugify(title)
        row.image_key = payload.image_key or None
        row.reading_time = payload.reading_time
        row.title = title
        row.button_name = payload.button_name.strip()
        row.slug = _unique_slug(
            db, ResourceRow, slug, current_id, "slug", "admin.resources.slug.invalid", "admin.resources.slug.duplicate"
        )
        row.pdf_key = payload.pdf_key or None
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)
        unique = list(dict.fromkeys(payload.resource_category_ids))
        cats: list[ResourceCategoryRow] = []
        if unique:
            cats = db.query(ResourceCategoryRow).filter(ResourceCategoryRow.id.in_(unique)).all()
            if len(cats) != len(unique):
                raise CatalogError(
                    422,
                    FieldErrors(
                        fields={"resource_category_ids": FieldErrorDetail(message_key="admin.resources.categories.invalid")}
                    ).model_dump(),
                )
            by_id = {item.id: item for item in cats}
            cats = [by_id[item] for item in unique]
        row.category_links = [ResourceCategoryLink(category=item) for item in cats]

    def _summary(self, row: ResourceRow) -> ResourceSummary:
        return ResourceSummary(
            id=row.id,
            seo=seo_snippet(row.seo),
            created_at=row.created_at,
            image_key=row.image_key,
            state=row.status,
        )

    def _detail(self, row: ResourceRow) -> Resource:
        categories = [
            ResourcesCategory(
                id=link.category.id, name=link.category.name, status=link.category.status, created_at=link.category.created_at
            )
            for link in row.category_links
            if link.category
        ]
        return Resource(
            id=row.id,
            image_key=row.image_key,
            reading_time=row.reading_time,
            title=row.title,
            button_name=row.button_name,
            slug=row.slug,
            pdf_key=row.pdf_key,
            resource_category_ids=[item.id for item in categories],
            resource_categories=categories,
            seo=ContentSeo.model_validate(row.seo or {}),
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: ResourceRow) -> PublicResource:
        return PublicResource(
            image_key=row.image_key,
            reading_time=row.reading_time,
            title=row.title,
            button_name=row.button_name,
            slug=row.slug,
            pdf_key=row.pdf_key,
            resource_categories=[
                PublicResourceCategory(name=link.category.name) for link in row.category_links if link.category
            ],
            seo=ContentSeo.model_validate(row.seo or {}),
        )


class MembershipService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> MembershipList:
        query = db.query(MembershipRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(MembershipRow.title.ilike(term), MembershipRow.description.ilike(term)))
        page, per_page, rows, total = _paginate(query.order_by(MembershipRow.created_at.desc()), page, per_page)
        return MembershipList(
            items=[
                MembershipSummary(
                    id=row.id,
                    title=row.title,
                    images=len(row.images or []),
                    seo_title=(row.seo or {}).get("title") or "",
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicMembershipList:
        query = db.query(MembershipRow).filter(MembershipRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(query.order_by(MembershipRow.created_at.desc()), page, per_page)
        return PublicMembershipList(items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total)

    def get(self, db: Session, item_id: UUID) -> Membership:
        row = db.get(MembershipRow, item_id)
        if row is None:
            raise _not_found("admin.memberships.not_found")
        return self._detail(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicMembership:
        row = db.get(MembershipRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.memberships.not_found")
        return self._public(row)

    def create(self, db: Session, payload: MembershipWrite) -> Membership:
        row = MembershipRow(created_at=datetime.now(UTC))
        self._apply(row, payload)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: MembershipWrite) -> Membership:
        row = db.get(MembershipRow, item_id)
        if row is None:
            raise _not_found("admin.memberships.not_found")
        self._apply(row, payload)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(MembershipRow, item_id)
        if row is None:
            raise _not_found("admin.memberships.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, row: MembershipRow, payload: MembershipWrite) -> None:
        row.title = _required(payload.title, "title")
        row.description = payload.description.strip()
        row.images = [item.model_dump() for item in payload.images]
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)

    def _detail(self, row: MembershipRow) -> Membership:
        return Membership(
            id=row.id,
            title=row.title,
            description=row.description,
            images=[MembershipImage.model_validate(item) for item in (row.images or [])],
            seo=ContentSeo.model_validate(row.seo or {}),
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: MembershipRow) -> PublicMembership:
        return PublicMembership(
            id=row.id,
            title=row.title,
            description=row.description,
            images=[PublicMembershipImage.model_validate(item) for item in (row.images or [])],
            seo=ContentSeo.model_validate(row.seo or {}),
        )


def _required_pdf_key(value: str) -> str:
    key = (value or "").strip()
    if not key:
        raise CatalogError(
            422,
            FieldErrors(fields={"file_key": FieldErrorDetail(message_key="admin.field.required")}).model_dump(),
        )
    if not is_valid_media_key(key) or not key.lower().endswith(".pdf"):
        raise CatalogError(
            422,
            FieldErrors(fields={"file_key": FieldErrorDetail(message_key="admin.media.type.invalid")}).model_dump(),
        )
    return key


def _unique_email(db: Session, email: str, current_id: UUID | None) -> str:
    existing = db.query(SubscriptionRow).filter(func.lower(SubscriptionRow.email) == email.lower()).first()
    if existing is not None and existing.id != current_id:
        raise CatalogError(
            422,
            FieldErrors(
                fields={"email": FieldErrorDetail(message_key="admin.subscriptions.email.duplicate")}
            ).model_dump(),
        )
    return email


class ContactService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> ContactList:
        query = db.query(ContactRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    ContactRow.name.ilike(term),
                    ContactRow.last_name.ilike(term),
                    ContactRow.email.ilike(term),
                    ContactRow.country.ilike(term),
                    ContactRow.company_name.ilike(term),
                    ContactRow.subject.ilike(term),
                )
            )
        page, per_page, rows, total = _paginate(query.order_by(ContactRow.created_at.desc()), page, per_page)
        return ContactList(
            items=[
                ContactSummary(
                    id=row.id, name=row.name, email=row.email, country=row.country, state=row.status
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicContactList:
        query = db.query(ContactRow).filter(ContactRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(query.order_by(ContactRow.created_at.desc()), page, per_page)
        return PublicContactList(items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total)

    def get(self, db: Session, item_id: UUID) -> Contact:
        row = db.get(ContactRow, item_id)
        if row is None:
            raise _not_found("admin.contacts.not_found")
        return self._detail(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicContact:
        row = db.get(ContactRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.contacts.not_found")
        return self._public(row)

    def create(self, db: Session, payload: ContactWrite) -> Contact:
        row = ContactRow(created_at=datetime.now(UTC))
        self._apply(row, payload)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: ContactWrite) -> Contact:
        row = db.get(ContactRow, item_id)
        if row is None:
            raise _not_found("admin.contacts.not_found")
        self._apply(row, payload)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(ContactRow, item_id)
        if row is None:
            raise _not_found("admin.contacts.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, row: ContactRow, payload: ContactWrite) -> None:
        row.name = _required(payload.name, "name")
        row.last_name = payload.last_name.strip()
        row.email = str(payload.email).strip()
        row.country = payload.country.strip()
        row.phone = payload.phone.strip()
        row.subject = payload.subject.strip()
        row.contact_date = payload.contact_date
        row.details = payload.details.strip()
        row.contact_type = payload.contact_type.strip()
        row.company_name = payload.company_name.strip()
        row.status = coerce_status(payload.status)

    def _detail(self, row: ContactRow) -> Contact:
        return Contact(
            id=row.id,
            name=row.name,
            last_name=row.last_name,
            email=row.email,
            country=row.country,
            phone=row.phone,
            subject=row.subject,
            contact_date=row.contact_date,
            details=row.details,
            contact_type=row.contact_type,
            company_name=row.company_name,
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: ContactRow) -> PublicContact:
        return PublicContact(
            id=row.id,
            name=row.name,
            last_name=row.last_name,
            email=row.email,
            country=row.country,
            phone=row.phone,
            subject=row.subject,
            contact_date=row.contact_date,
            details=row.details,
            contact_type=row.contact_type,
            company_name=row.company_name,
        )


class DownloadService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> DownloadList:
        query = db.query(DownloadRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(DownloadRow.name.ilike(term), DownloadRow.company.ilike(term)))
        page, per_page, rows, total = _paginate(query.order_by(DownloadRow.created_at.desc()), page, per_page)
        return DownloadList(
            items=[DownloadSummary(id=row.id, name=row.name, state=row.status) for row in rows],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicDownloadList:
        query = db.query(DownloadRow).filter(DownloadRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(query.order_by(DownloadRow.created_at.desc()), page, per_page)
        return PublicDownloadList(items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total)

    def get(self, db: Session, item_id: UUID) -> Download:
        row = db.get(DownloadRow, item_id)
        if row is None:
            raise _not_found("admin.downloads.not_found")
        return self._detail(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicDownload:
        row = db.get(DownloadRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.downloads.not_found")
        return self._public(row)

    def create(self, db: Session, payload: DownloadWrite) -> Download:
        row = DownloadRow(created_at=datetime.now(UTC))
        self._apply(row, payload)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: DownloadWrite) -> Download:
        row = db.get(DownloadRow, item_id)
        if row is None:
            raise _not_found("admin.downloads.not_found")
        self._apply(row, payload)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(DownloadRow, item_id)
        if row is None:
            raise _not_found("admin.downloads.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, row: DownloadRow, payload: DownloadWrite) -> None:
        row.name = _required(payload.name, "name")
        row.company = payload.company.strip()
        row.file_key = _required_pdf_key(payload.file_key)
        row.status = coerce_status(payload.status)

    def _detail(self, row: DownloadRow) -> Download:
        return Download(
            id=row.id,
            name=row.name,
            company=row.company,
            file_key=row.file_key,
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: DownloadRow) -> PublicDownload:
        return PublicDownload(id=row.id, name=row.name, company=row.company, file_key=row.file_key)


class FlycatchSaudiArabiaService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> FlycatchSaudiArabiaList:
        query = db.query(FlycatchSaudiArabiaRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    FlycatchSaudiArabiaRow.banner_title.ilike(term),
                    FlycatchSaudiArabiaRow.services_title.ilike(term),
                    FlycatchSaudiArabiaRow.banner_explore_text.ilike(term),
                )
            )
        page, per_page, rows, total = _paginate(
            query.order_by(FlycatchSaudiArabiaRow.created_at.desc()), page, per_page
        )
        return FlycatchSaudiArabiaList(
            items=[
                FlycatchSaudiArabiaSummary(
                    id=row.id,
                    banner_title=row.banner_title,
                    service_section=len(row.service_section or []),
                    service_section_names=[
                        str(item.get("types_title") or "") for item in (row.service_section or [])
                    ],
                    video_format=document_format(row.video_key),
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicFlycatchSaudiArabiaList:
        query = db.query(FlycatchSaudiArabiaRow).filter(FlycatchSaudiArabiaRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(
            query.order_by(FlycatchSaudiArabiaRow.created_at.desc()), page, per_page
        )
        return PublicFlycatchSaudiArabiaList(
            items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total
        )

    def get(self, db: Session, item_id: UUID) -> FlycatchSaudiArabia:
        row = db.get(FlycatchSaudiArabiaRow, item_id)
        if row is None:
            raise _not_found("admin.flycatch_saudi_arabia.not_found")
        return self._detail(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicFlycatchSaudiArabia:
        row = db.get(FlycatchSaudiArabiaRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.flycatch_saudi_arabia.not_found")
        return self._public(row)

    def create(self, db: Session, payload: FlycatchSaudiArabiaWrite) -> FlycatchSaudiArabia:
        row = FlycatchSaudiArabiaRow(created_at=datetime.now(UTC))
        self._apply(row, payload)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: FlycatchSaudiArabiaWrite) -> FlycatchSaudiArabia:
        row = db.get(FlycatchSaudiArabiaRow, item_id)
        if row is None:
            raise _not_found("admin.flycatch_saudi_arabia.not_found")
        self._apply(row, payload)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(FlycatchSaudiArabiaRow, item_id)
        if row is None:
            raise _not_found("admin.flycatch_saudi_arabia.not_found")
        db.delete(row)
        db.commit()

    def _apply(self, row: FlycatchSaudiArabiaRow, payload: FlycatchSaudiArabiaWrite) -> None:
        row.banner_title = _required(payload.banner_title, "banner_title")
        row.banner_explore_text = payload.banner_explore_text.strip()
        row.services_title = payload.services_title.strip()
        row.video_key = optional_key(payload.video_key, "video_key")
        row.seo = seo_dict(payload.seo)
        row.status = coerce_status(payload.status)
        row.service_section = [
            {
                "image_key": optional_key(item.image_key, "service_section.image_key"),
                "types_title": item.types_title.strip(),
                "contents": item.contents.strip(),
                "links": item.links.strip(),
            }
            for item in payload.service_section
        ]

    def _detail(self, row: FlycatchSaudiArabiaRow) -> FlycatchSaudiArabia:
        return FlycatchSaudiArabia(
            id=row.id,
            banner_title=row.banner_title,
            service_section=[ServiceSectionItem.model_validate(item) for item in (row.service_section or [])],
            banner_explore_text=row.banner_explore_text,
            services_title=row.services_title,
            video_key=row.video_key,
            seo=ContentSeo.model_validate(row.seo or {}),
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: FlycatchSaudiArabiaRow) -> PublicFlycatchSaudiArabia:
        return PublicFlycatchSaudiArabia(
            id=row.id,
            banner_title=row.banner_title,
            service_section=[
                PublicServiceSectionItem.model_validate(item) for item in (row.service_section or [])
            ],
            banner_explore_text=row.banner_explore_text,
            services_title=row.services_title,
            video_key=row.video_key,
            seo=ContentSeo.model_validate(row.seo or {}),
        )


class SubscriptionService:
    def list_items(self, db: Session, q: str | None, page: int, per_page: int) -> SubscriptionList:
        query = db.query(SubscriptionRow)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(SubscriptionRow.email.ilike(term))
        page, per_page, rows, total = _paginate(query.order_by(SubscriptionRow.created_at.desc()), page, per_page)
        return SubscriptionList(
            items=[
                SubscriptionSummary(
                    id=row.id,
                    email=row.email,
                    active=row.active,
                    created_at=row.created_at,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session, q: str | None, page: int, per_page: int) -> PublicSubscriptionList:
        query = db.query(SubscriptionRow).filter(SubscriptionRow.status == ContentStatus.publish)
        page, per_page, rows, total = _paginate(query.order_by(SubscriptionRow.created_at.desc()), page, per_page)
        return PublicSubscriptionList(
            items=[self._public(row) for row in rows], page=page, per_page=per_page, total=total
        )

    def get(self, db: Session, item_id: UUID) -> Subscription:
        row = db.get(SubscriptionRow, item_id)
        if row is None:
            raise _not_found("admin.subscriptions.not_found")
        return self._detail(row)

    def get_published(self, db: Session, item_id: UUID) -> PublicSubscription:
        row = db.get(SubscriptionRow, item_id)
        if row is None or row.status != ContentStatus.publish:
            raise _not_found("public.subscriptions.not_found")
        return self._public(row)

    def create(self, db: Session, payload: SubscriptionWrite) -> Subscription:
        row = SubscriptionRow(created_at=datetime.now(UTC))
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def update(self, db: Session, item_id: UUID, payload: SubscriptionWrite) -> Subscription:
        row = db.get(SubscriptionRow, item_id)
        if row is None:
            raise _not_found("admin.subscriptions.not_found")
        self._apply(db, row, payload, item_id)
        db.commit()
        db.refresh(row)
        return self._detail(row)

    def delete(self, db: Session, item_id: UUID) -> None:
        row = db.get(SubscriptionRow, item_id)
        if row is None:
            raise _not_found("admin.subscriptions.not_found")
        db.delete(row)
        db.commit()

    def _apply(
        self, db: Session, row: SubscriptionRow, payload: SubscriptionWrite, current_id: UUID | None
    ) -> None:
        row.email = _unique_email(db, str(payload.email).strip(), current_id)
        row.active = bool(payload.active)
        row.status = coerce_status(payload.status)

    def _detail(self, row: SubscriptionRow) -> Subscription:
        return Subscription(
            id=row.id,
            email=row.email,
            active=row.active,
            status=row.status,
            created_at=row.created_at,
        )

    def _public(self, row: SubscriptionRow) -> PublicSubscription:
        return PublicSubscription(id=row.id, email=row.email, active=row.active, created_at=row.created_at)


application_service = ApplicationService()
opening_service = OpeningService()
employee_testimonial_service = EmployeeTestimonialService()
email_configuration_service = EmailConfigurationService()
email_template_service = EmailTemplateService()
news_service = NewsService()
resource_service = ResourceService()
membership_service = MembershipService()
contact_service = ContactService()
download_service = DownloadService()
flycatch_saudi_arabia_service = FlycatchSaudiArabiaService()
subscription_service = SubscriptionService()
