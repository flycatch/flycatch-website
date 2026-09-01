from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from flycatch_api.db import get_db
from flycatch_api.schemas import admin_catalog as admin
from flycatch_api.schemas import public_catalog as public
from flycatch_api.security.dependencies import CurrentSession, assert_resource_action, assert_write_permissions
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.catalog_service import (
    application_service,
    contact_service,
    download_service,
    email_configuration_service,
    email_template_service,
    employee_testimonial_service,
    flycatch_saudi_arabia_service,
    membership_service,
    news_category_service,
    news_service,
    opening_service,
    resource_category_service,
    resource_service,
    subscription_service,
)
from flycatch_api.services.industry_service import PER_PAGE


def _raise(error: CatalogError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.payload)


def admin_crud(*, prefix: str, tags: str, resource: str, list_model, detail_model, write_model, svc, id_name: str):
    router = APIRouter(prefix=prefix, tags=[tags])

    @router.get("", response_model=list_model)
    def list_items(
        session: CurrentSession,
        db: Session = Depends(get_db),
        q: str | None = Query(default=None),
        page: int = Query(default=1, ge=1),
        per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
    ):
        assert_resource_action(db, session.administrator_id, resource, "read")
        return svc.list_items(db, q, page, per_page)

    @router.post("", response_model=detail_model, status_code=status.HTTP_201_CREATED)
    def create_item(payload: write_model, session: CurrentSession, db: Session = Depends(get_db)):
        assert_write_permissions(
            db, session.administrator_id, resource, action="create", status_value=payload.status
        )
        try:
            return svc.create(db, payload)
        except CatalogError as error:
            _raise(error)

    path = "/{" + id_name + "}"
    ns = {
        "UUID": UUID,
        "CurrentSession": CurrentSession,
        "Session": Session,
        "Depends": Depends,
        "get_db": get_db,
        "assert_resource_action": assert_resource_action,
        "assert_write_permissions": assert_write_permissions,
        "CatalogError": CatalogError,
        "resource": resource,
        "svc": svc,
        "write_model": write_model,
        "_raise": _raise,
        "Response": Response,
        "status": status,
    }
    exec(
        f"""
def get_item({id_name}: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, resource, "read")
    try:
        return svc.get(db, {id_name})
    except CatalogError as error:
        _raise(error)

def update_item({id_name}: UUID, payload: write_model, session: CurrentSession, db: Session = Depends(get_db)):
    assert_write_permissions(db, session.administrator_id, resource, action="update", status_value=payload.status)
    try:
        return svc.update(db, {id_name}, payload)
    except CatalogError as error:
        _raise(error)

def delete_item({id_name}: UUID, session: CurrentSession, db: Session = Depends(get_db)):
    assert_resource_action(db, session.administrator_id, resource, "delete")
    try:
        svc.delete(db, {id_name})
    except CatalogError as error:
        _raise(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
""",
        ns,
    )
    router.add_api_route(path, ns["get_item"], methods=["GET"], response_model=detail_model)
    router.add_api_route(path, ns["update_item"], methods=["PATCH"], response_model=detail_model)
    router.add_api_route(
        path, ns["delete_item"], methods=["DELETE"], status_code=status.HTTP_204_NO_CONTENT
    )
    return router


def public_uuid(*, prefix: str, tags: str, list_model, detail_model, svc, id_name: str):
    router = APIRouter(prefix=prefix, tags=[tags])

    @router.get("", response_model=list_model, response_model_exclude_none=True)
    def list_published(
        db: Session = Depends(get_db),
        q: str | None = Query(default=None),
        page: int = Query(default=1, ge=1),
        per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
    ):
        return svc.list_published(db, q, page, per_page)

    ns = {
        "UUID": UUID,
        "Session": Session,
        "Depends": Depends,
        "get_db": get_db,
        "CatalogError": CatalogError,
        "svc": svc,
        "_raise": _raise,
    }
    exec(
        f"""
def get_published({id_name}: UUID, db: Session = Depends(get_db)):
    try:
        return svc.get_published(db, {id_name})
    except CatalogError as error:
        _raise(error)
""",
        ns,
    )
    router.add_api_route(
        "/{" + id_name + "}",
        ns["get_published"],
        methods=["GET"],
        response_model=detail_model,
        response_model_exclude_none=True,
    )
    return router


def public_slug(*, prefix: str, tags: str, list_model, detail_model, svc):
    router = APIRouter(prefix=prefix, tags=[tags])

    @router.get("", response_model=list_model, response_model_exclude_none=True)
    def list_published(
        db: Session = Depends(get_db),
        q: str | None = Query(default=None),
        page: int = Query(default=1, ge=1),
        per_page: int = Query(default=PER_PAGE, ge=1, le=PER_PAGE),
    ):
        return svc.list_published(db, q, page, per_page)

    @router.get("/{slug}", response_model=detail_model, response_model_exclude_none=True)
    def get_published(slug: str, db: Session = Depends(get_db)):
        try:
            return svc.get_published_by_slug(db, slug)
        except CatalogError as error:
            _raise(error)

    return router


admin_applications = admin_crud(
    prefix="/admin/applications",
    tags="admin-applications",
    resource="applications",
    list_model=admin.ApplicationList,
    detail_model=admin.Application,
    write_model=admin.ApplicationWrite,
    svc=application_service,
    id_name="application_id",
)
admin_openings = admin_crud(
    prefix="/admin/openings",
    tags="admin-openings",
    resource="openings",
    list_model=admin.OpeningList,
    detail_model=admin.Opening,
    write_model=admin.OpeningWrite,
    svc=opening_service,
    id_name="opening_id",
)
admin_employee_testimonials = admin_crud(
    prefix="/admin/employee-testimonials",
    tags="admin-employee-testimonials",
    resource="employee_testimonials",
    list_model=admin.EmployeeTestimonialList,
    detail_model=admin.EmployeeTestimonial,
    write_model=admin.EmployeeTestimonialWrite,
    svc=employee_testimonial_service,
    id_name="testimonial_id",
)
admin_email_configuration = admin_crud(
    prefix="/admin/email-configuration",
    tags="admin-email-configuration",
    resource="email_configuration",
    list_model=admin.EmailConfigurationList,
    detail_model=admin.EmailConfiguration,
    write_model=admin.EmailConfigurationWrite,
    svc=email_configuration_service,
    id_name="config_id",
)
admin_email_templates = admin_crud(
    prefix="/admin/email-templates",
    tags="admin-email-templates",
    resource="email_templates",
    list_model=admin.EmailTemplateList,
    detail_model=admin.EmailTemplate,
    write_model=admin.EmailTemplateWrite,
    svc=email_template_service,
    id_name="template_id",
)
admin_news_categories = admin_crud(
    prefix="/admin/news-categories",
    tags="admin-news-categories",
    resource="news_categories",
    list_model=admin.NewsCategoryList,
    detail_model=admin.NewsCategory,
    write_model=admin.NewsCategoryWrite,
    svc=news_category_service,
    id_name="item_id",
)
admin_news = admin_crud(
    prefix="/admin/news",
    tags="admin-news",
    resource="news",
    list_model=admin.NewsList,
    detail_model=admin.News,
    write_model=admin.NewsWrite,
    svc=news_service,
    id_name="news_id",
)
admin_resource_categories = admin_crud(
    prefix="/admin/resource-categories",
    tags="admin-resource-categories",
    resource="resource_categories",
    list_model=admin.ResourcesCategoryList,
    detail_model=admin.ResourcesCategory,
    write_model=admin.ResourcesCategoryWrite,
    svc=resource_category_service,
    id_name="item_id",
)
admin_resources = admin_crud(
    prefix="/admin/resources",
    tags="admin-resources",
    resource="resources",
    list_model=admin.ResourceList,
    detail_model=admin.Resource,
    write_model=admin.ResourceWrite,
    svc=resource_service,
    id_name="resource_id",
)
admin_memberships = admin_crud(
    prefix="/admin/memberships",
    tags="admin-memberships",
    resource="memberships",
    list_model=admin.MembershipList,
    detail_model=admin.Membership,
    write_model=admin.MembershipWrite,
    svc=membership_service,
    id_name="membership_id",
)
admin_contacts = admin_crud(
    prefix="/admin/contacts",
    tags="admin-contacts",
    resource="contacts",
    list_model=admin.ContactList,
    detail_model=admin.Contact,
    write_model=admin.ContactWrite,
    svc=contact_service,
    id_name="contact_id",
)
admin_downloads = admin_crud(
    prefix="/admin/downloads",
    tags="admin-downloads",
    resource="downloads",
    list_model=admin.DownloadList,
    detail_model=admin.Download,
    write_model=admin.DownloadWrite,
    svc=download_service,
    id_name="download_id",
)
admin_flycatch_saudi_arabia = admin_crud(
    prefix="/admin/flycatch-saudi-arabia",
    tags="admin-flycatch-saudi-arabia",
    resource="flycatch_saudi_arabia",
    list_model=admin.FlycatchSaudiArabiaList,
    detail_model=admin.FlycatchSaudiArabia,
    write_model=admin.FlycatchSaudiArabiaWrite,
    svc=flycatch_saudi_arabia_service,
    id_name="item_id",
)
admin_subscriptions = admin_crud(
    prefix="/admin/subscriptions",
    tags="admin-subscriptions",
    resource="subscriptions",
    list_model=admin.SubscriptionList,
    detail_model=admin.Subscription,
    write_model=admin.SubscriptionWrite,
    svc=subscription_service,
    id_name="subscription_id",
)

public_applications = public_uuid(
    prefix="/public/applications",
    tags="public-applications",
    list_model=public.PublicApplicationList,
    detail_model=public.PublicApplication,
    svc=application_service,
    id_name="application_id",
)
public_openings = public_slug(
    prefix="/public/openings",
    tags="public-openings",
    list_model=public.PublicOpeningList,
    detail_model=public.PublicOpening,
    svc=opening_service,
)
public_employee_testimonials = public_uuid(
    prefix="/public/employee-testimonials",
    tags="public-employee-testimonials",
    list_model=public.PublicEmployeeTestimonialList,
    detail_model=public.PublicEmployeeTestimonial,
    svc=employee_testimonial_service,
    id_name="testimonial_id",
)
public_email_configuration = public_uuid(
    prefix="/public/email-configuration",
    tags="public-email-configuration",
    list_model=public.PublicEmailConfigurationList,
    detail_model=public.PublicEmailConfiguration,
    svc=email_configuration_service,
    id_name="config_id",
)
public_email_templates = public_slug(
    prefix="/public/email-templates",
    tags="public-email-templates",
    list_model=public.PublicEmailTemplateList,
    detail_model=public.PublicEmailTemplate,
    svc=email_template_service,
)
public_news_categories = public_uuid(
    prefix="/public/news-categories",
    tags="public-news-categories",
    list_model=public.PublicNewsCategoryList,
    detail_model=public.PublicNewsCategory,
    svc=news_category_service,
    id_name="item_id",
)
public_news = public_slug(
    prefix="/public/news",
    tags="public-news",
    list_model=public.PublicNewsList,
    detail_model=public.PublicNews,
    svc=news_service,
)
public_resource_categories = public_uuid(
    prefix="/public/resource-categories",
    tags="public-resource-categories",
    list_model=public.PublicResourcesCategoryList,
    detail_model=public.PublicResourcesCategory,
    svc=resource_category_service,
    id_name="item_id",
)
public_resources = public_slug(
    prefix="/public/resources",
    tags="public-resources",
    list_model=public.PublicResourceList,
    detail_model=public.PublicResource,
    svc=resource_service,
)
public_memberships = public_uuid(
    prefix="/public/memberships",
    tags="public-memberships",
    list_model=public.PublicMembershipList,
    detail_model=public.PublicMembership,
    svc=membership_service,
    id_name="membership_id",
)
public_contacts = public_uuid(
    prefix="/public/contacts",
    tags="public-contacts",
    list_model=public.PublicContactList,
    detail_model=public.PublicContact,
    svc=contact_service,
    id_name="contact_id",
)
public_downloads = public_uuid(
    prefix="/public/downloads",
    tags="public-downloads",
    list_model=public.PublicDownloadList,
    detail_model=public.PublicDownload,
    svc=download_service,
    id_name="download_id",
)
public_flycatch_saudi_arabia = public_uuid(
    prefix="/public/flycatch-saudi-arabia",
    tags="public-flycatch-saudi-arabia",
    list_model=public.PublicFlycatchSaudiArabiaList,
    detail_model=public.PublicFlycatchSaudiArabia,
    svc=flycatch_saudi_arabia_service,
    id_name="item_id",
)
public_subscriptions = public_uuid(
    prefix="/public/subscriptions",
    tags="public-subscriptions",
    list_model=public.PublicSubscriptionList,
    detail_model=public.PublicSubscription,
    svc=subscription_service,
    id_name="subscription_id",
)
