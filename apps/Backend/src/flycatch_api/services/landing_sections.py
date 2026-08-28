from __future__ import annotations

from flycatch_api.models.landing_pages import (
    ApplicationDevelopment,
    ApplicationModernization,
    DevOpsConsult,
    InfrastructureManagement,
    MobileApplicationDevelopment,
    Overview,
    UserCenteredDesign,
)
from flycatch_api.schemas import admin_landings as admin
from flycatch_api.schemas import public_landings as public
from flycatch_api.services.landing_catalog import LandingCatalogService, LandingFeatures

DEVOPS = LandingCatalogService(
    model=DevOpsConsult,
    detail_schema=admin.DevOpsConsult,
    write_schema=admin.DevOpsConsultWrite,
    summary_schema=admin.DevOpsConsultSummary,
    list_schema=admin.DevOpsConsultList,
    public_schema=public.PublicDevOpsConsult,
    resource="devops_consult",
    features=LandingFeatures(has_experience=True, has_faq=True),
)

INFRASTRUCTURE = LandingCatalogService(
    model=InfrastructureManagement,
    detail_schema=admin.InfrastructureManagement,
    write_schema=admin.InfrastructureManagementWrite,
    summary_schema=admin.InfrastructureManagementSummary,
    list_schema=admin.InfrastructureManagementList,
    public_schema=public.PublicInfrastructureManagement,
    resource="infrastructure_management",
    features=LandingFeatures(has_faq=True),
)

APPLICATION_DEVELOPMENT = LandingCatalogService(
    model=ApplicationDevelopment,
    detail_schema=admin.ApplicationDevelopment,
    write_schema=admin.ApplicationDevelopmentWrite,
    summary_schema=admin.ApplicationDevelopmentSummary,
    list_schema=admin.ApplicationDevelopmentList,
    public_schema=public.PublicApplicationDevelopment,
    resource="application_development",
    features=LandingFeatures(
        has_accordion=True,
        has_offering=True,
        has_faq=True,
        has_locale=True,
        list_kind="intro_first",
    ),
)

APPLICATION_MODERNIZATION = LandingCatalogService(
    model=ApplicationModernization,
    detail_schema=admin.ApplicationModernization,
    write_schema=admin.ApplicationModernizationWrite,
    summary_schema=admin.ApplicationModernizationSummary,
    list_schema=admin.ApplicationModernizationList,
    public_schema=public.PublicApplicationModernization,
    resource="application_modernization",
    features=LandingFeatures(has_accordion=True, has_offering=True, has_faq=True, list_kind="seo"),
)

MOBILE_APPLICATION = LandingCatalogService(
    model=MobileApplicationDevelopment,
    detail_schema=admin.MobileApplicationDevelopment,
    write_schema=admin.MobileApplicationDevelopmentWrite,
    summary_schema=admin.MobileApplicationDevelopmentSummary,
    list_schema=admin.MobileApplicationDevelopmentList,
    public_schema=public.PublicMobileApplicationDevelopment,
    resource="mobile_application_development",
    features=LandingFeatures(
        has_third_intro=True,
        has_accordion=True,
        has_offering=True,
        has_faq=True,
        list_kind="seo",
    ),
)

USER_CENTERED_DESIGN = LandingCatalogService(
    model=UserCenteredDesign,
    detail_schema=admin.UserCenteredDesign,
    write_schema=admin.UserCenteredDesignWrite,
    summary_schema=admin.UserCenteredDesignSummary,
    list_schema=admin.UserCenteredDesignList,
    public_schema=public.PublicUserCenteredDesign,
    resource="user_centered_design",
    features=LandingFeatures(has_accordion=True, has_offering=True, has_faq=True),
)

OVERVIEW = LandingCatalogService(
    model=Overview,
    detail_schema=admin.Overview,
    write_schema=admin.OverviewWrite,
    summary_schema=admin.OverviewSummary,
    list_schema=admin.OverviewList,
    public_schema=public.PublicOverview,
    resource="overview",
    features=LandingFeatures(),
)
