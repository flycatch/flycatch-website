from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from flycatch_api.api import (
    admin_ai_services,
    admin_auth,
    admin_authors,
    admin_blogs,
    admin_case_studies,
    admin_case_study_categories,
    admin_categories,
    admin_client_logos,
    admin_client_testimonials,
    admin_cloud_services,
    admin_data_analytics,
    admin_digital_transformation,
    admin_homes,
    admin_industries,
    admin_management,
    admin_media,
    admin_roles,
    admin_solution_details,
    admin_solution_products,
    admin_solutions,
    admin_technologies,
    landing_pages,
    catalog,
    public_ai_services,
    public_authors,
    public_blogs,
    public_case_studies,
    public_categories,
    public_client_logos,
    public_client_testimonials,
    public_cloud_services,
    public_data_analytics,
    public_digital_transformation,
    public_homes,
    public_media,
    public_solution_details,
    public_solution_products,
    public_solutions,
    public_technologies,
    publish,
    stubs,
)

app = FastAPI(title="Flycatch API", version="2.0.0", docs_url="/api/docs", openapi_url="/api/openapi.json")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, _exc: SQLAlchemyError):
    return JSONResponse(
        status_code=503,
        content={
            "code": "unavailable",
            "message_key": "admin.workspace.request_failed",
        },
    )


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path.startswith("/admin") or request.url.path.startswith("/api/v1/admin"):
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth.router, prefix="/api/v1")
app.include_router(admin_management.router, prefix="/api/v1")
app.include_router(admin_roles.router, prefix="/api/v1")
app.include_router(admin_blogs.router, prefix="/api/v1")
app.include_router(admin_authors.router, prefix="/api/v1")
app.include_router(admin_categories.router, prefix="/api/v1")
app.include_router(admin_case_studies.router, prefix="/api/v1")
app.include_router(admin_industries.router, prefix="/api/v1")
app.include_router(admin_case_study_categories.router, prefix="/api/v1")
app.include_router(admin_technologies.router, prefix="/api/v1")
app.include_router(admin_client_logos.router, prefix="/api/v1")
app.include_router(admin_client_testimonials.router, prefix="/api/v1")
app.include_router(admin_homes.router, prefix="/api/v1")
app.include_router(admin_solutions.router, prefix="/api/v1")
app.include_router(admin_solution_details.router, prefix="/api/v1")
app.include_router(admin_solution_products.router, prefix="/api/v1")
app.include_router(admin_ai_services.router, prefix="/api/v1")
app.include_router(admin_cloud_services.router, prefix="/api/v1")
app.include_router(admin_data_analytics.router, prefix="/api/v1")
app.include_router(admin_digital_transformation.router, prefix="/api/v1")
app.include_router(landing_pages.admin_devops_consult, prefix="/api/v1")
app.include_router(landing_pages.admin_infrastructure_management, prefix="/api/v1")
app.include_router(landing_pages.admin_application_development, prefix="/api/v1")
app.include_router(landing_pages.admin_application_modernization, prefix="/api/v1")
app.include_router(landing_pages.admin_mobile_application_development, prefix="/api/v1")
app.include_router(landing_pages.admin_user_centered_design, prefix="/api/v1")
app.include_router(landing_pages.admin_overview, prefix="/api/v1")
app.include_router(catalog.admin_applications, prefix="/api/v1")
app.include_router(catalog.admin_openings, prefix="/api/v1")
app.include_router(catalog.admin_employee_testimonials, prefix="/api/v1")
app.include_router(catalog.admin_email_configuration, prefix="/api/v1")
app.include_router(catalog.admin_email_templates, prefix="/api/v1")
app.include_router(catalog.admin_news_categories, prefix="/api/v1")
app.include_router(catalog.admin_news, prefix="/api/v1")
app.include_router(catalog.admin_resource_categories, prefix="/api/v1")
app.include_router(catalog.admin_resources, prefix="/api/v1")
app.include_router(catalog.admin_memberships, prefix="/api/v1")
app.include_router(catalog.admin_contacts, prefix="/api/v1")
app.include_router(catalog.admin_downloads, prefix="/api/v1")
app.include_router(catalog.admin_flycatch_saudi_arabia, prefix="/api/v1")
app.include_router(catalog.admin_subscriptions, prefix="/api/v1")
app.include_router(admin_media.router, prefix="/api/v1")
app.include_router(publish.router, prefix="/api/v1")
app.include_router(public_blogs.router, prefix="/api/v1")
app.include_router(public_authors.router, prefix="/api/v1")
app.include_router(public_categories.router, prefix="/api/v1")
app.include_router(public_case_studies.router, prefix="/api/v1")
app.include_router(public_technologies.router, prefix="/api/v1")
app.include_router(public_client_logos.router, prefix="/api/v1")
app.include_router(public_client_testimonials.router, prefix="/api/v1")
app.include_router(public_homes.router, prefix="/api/v1")
app.include_router(public_solutions.router, prefix="/api/v1")
app.include_router(public_solution_details.router, prefix="/api/v1")
app.include_router(public_solution_products.router, prefix="/api/v1")
app.include_router(public_ai_services.router, prefix="/api/v1")
app.include_router(public_cloud_services.router, prefix="/api/v1")
app.include_router(public_data_analytics.router, prefix="/api/v1")
app.include_router(public_digital_transformation.router, prefix="/api/v1")
app.include_router(landing_pages.public_devops_consult, prefix="/api/v1")
app.include_router(landing_pages.public_infrastructure_management, prefix="/api/v1")
app.include_router(landing_pages.public_application_development, prefix="/api/v1")
app.include_router(landing_pages.public_application_modernization, prefix="/api/v1")
app.include_router(landing_pages.public_mobile_application_development, prefix="/api/v1")
app.include_router(landing_pages.public_user_centered_design, prefix="/api/v1")
app.include_router(landing_pages.public_overview, prefix="/api/v1")
app.include_router(catalog.public_applications, prefix="/api/v1")
app.include_router(catalog.public_openings, prefix="/api/v1")
app.include_router(catalog.public_employee_testimonials, prefix="/api/v1")
app.include_router(catalog.public_email_configuration, prefix="/api/v1")
app.include_router(catalog.public_email_templates, prefix="/api/v1")
app.include_router(catalog.public_news_categories, prefix="/api/v1")
app.include_router(catalog.public_news, prefix="/api/v1")
app.include_router(catalog.public_resource_categories, prefix="/api/v1")
app.include_router(catalog.public_resources, prefix="/api/v1")
app.include_router(catalog.public_memberships, prefix="/api/v1")
app.include_router(catalog.public_contacts, prefix="/api/v1")
app.include_router(catalog.public_downloads, prefix="/api/v1")
app.include_router(catalog.public_flycatch_saudi_arabia, prefix="/api/v1")
app.include_router(catalog.public_subscriptions, prefix="/api/v1")
app.include_router(public_media.router, prefix="/api/v1")
app.include_router(stubs.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
