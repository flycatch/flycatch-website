from flycatch_api.api.landing_routers import admin_landing_router, public_landing_router
from flycatch_api.schemas import admin_landings as admin
from flycatch_api.schemas.public_landings import (
    PublicApplicationDevelopment,
    PublicApplicationModernization,
    PublicDevOpsConsult,
    PublicInfrastructureManagement,
    PublicLandingList,
    PublicMobileApplicationDevelopment,
    PublicOverview,
    PublicUserCenteredDesign,
)
from flycatch_api.services import landing_sections as sections

admin_devops_consult = admin_landing_router(
    prefix="/admin/devops-consult",
    tags="admin-devops-consult",
    resource="devops_consult",
    service=sections.DEVOPS,
    list_model=admin.DevOpsConsultList,
    detail_model=admin.DevOpsConsult,
    write_model=admin.DevOpsConsultWrite,
)
public_devops_consult = public_landing_router(
    prefix="/public/devops-consult",
    tags="public-devops-consult",
    service=sections.DEVOPS,
    list_model=PublicLandingList,
    detail_model=PublicDevOpsConsult,
)

admin_infrastructure_management = admin_landing_router(
    prefix="/admin/infrastructure-management",
    tags="admin-infrastructure-management",
    resource="infrastructure_management",
    service=sections.INFRASTRUCTURE,
    list_model=admin.InfrastructureManagementList,
    detail_model=admin.InfrastructureManagement,
    write_model=admin.InfrastructureManagementWrite,
)
public_infrastructure_management = public_landing_router(
    prefix="/public/infrastructure-management",
    tags="public-infrastructure-management",
    service=sections.INFRASTRUCTURE,
    list_model=PublicLandingList,
    detail_model=PublicInfrastructureManagement,
)

admin_application_development = admin_landing_router(
    prefix="/admin/application-development",
    tags="admin-application-development",
    resource="application_development",
    service=sections.APPLICATION_DEVELOPMENT,
    list_model=admin.ApplicationDevelopmentList,
    detail_model=admin.ApplicationDevelopment,
    write_model=admin.ApplicationDevelopmentWrite,
)
public_application_development = public_landing_router(
    prefix="/public/application-development",
    tags="public-application-development",
    service=sections.APPLICATION_DEVELOPMENT,
    list_model=PublicLandingList,
    detail_model=PublicApplicationDevelopment,
)

admin_application_modernization = admin_landing_router(
    prefix="/admin/application-modernization",
    tags="admin-application-modernization",
    resource="application_modernization",
    service=sections.APPLICATION_MODERNIZATION,
    list_model=admin.ApplicationModernizationList,
    detail_model=admin.ApplicationModernization,
    write_model=admin.ApplicationModernizationWrite,
)
public_application_modernization = public_landing_router(
    prefix="/public/application-modernization",
    tags="public-application-modernization",
    service=sections.APPLICATION_MODERNIZATION,
    list_model=PublicLandingList,
    detail_model=PublicApplicationModernization,
)

admin_mobile_application_development = admin_landing_router(
    prefix="/admin/mobile-application-development",
    tags="admin-mobile-application-development",
    resource="mobile_application_development",
    service=sections.MOBILE_APPLICATION,
    list_model=admin.MobileApplicationDevelopmentList,
    detail_model=admin.MobileApplicationDevelopment,
    write_model=admin.MobileApplicationDevelopmentWrite,
)
public_mobile_application_development = public_landing_router(
    prefix="/public/mobile-application-development",
    tags="public-mobile-application-development",
    service=sections.MOBILE_APPLICATION,
    list_model=PublicLandingList,
    detail_model=PublicMobileApplicationDevelopment,
)

admin_user_centered_design = admin_landing_router(
    prefix="/admin/user-centered-design",
    tags="admin-user-centered-design",
    resource="user_centered_design",
    service=sections.USER_CENTERED_DESIGN,
    list_model=admin.UserCenteredDesignList,
    detail_model=admin.UserCenteredDesign,
    write_model=admin.UserCenteredDesignWrite,
)
public_user_centered_design = public_landing_router(
    prefix="/public/user-centered-design",
    tags="public-user-centered-design",
    service=sections.USER_CENTERED_DESIGN,
    list_model=PublicLandingList,
    detail_model=PublicUserCenteredDesign,
)

admin_overview = admin_landing_router(
    prefix="/admin/overview",
    tags="admin-overview",
    resource="overview",
    service=sections.OVERVIEW,
    list_model=admin.OverviewList,
    detail_model=admin.Overview,
    write_model=admin.OverviewWrite,
)
public_overview = public_landing_router(
    prefix="/public/overview",
    tags="public-overview",
    service=sections.OVERVIEW,
    list_model=PublicLandingList,
    detail_model=PublicOverview,
)
