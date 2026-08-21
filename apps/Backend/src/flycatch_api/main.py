from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from flycatch_api.api import (
    admin_auth,
    admin_authors,
    admin_blogs,
    admin_case_studies,
    admin_case_study_categories,
    admin_categories,
    admin_client_logos,
    admin_client_testimonials,
    admin_homes,
    admin_industries,
    admin_management,
    admin_media,
    admin_roles,
    admin_technologies,
    public_authors,
    public_blogs,
    public_case_studies,
    public_categories,
    public_client_logos,
    public_client_testimonials,
    public_homes,
    public_media,
    public_technologies,
    publish,
    stubs,
)

app = FastAPI(title="Flycatch API", version="2.0.0", docs_url="/api/docs", openapi_url="/openapi.json")


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
app.include_router(public_media.router, prefix="/api/v1")
app.include_router(stubs.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
