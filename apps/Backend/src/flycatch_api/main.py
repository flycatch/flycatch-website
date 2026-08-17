from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from flycatch_api.api import admin_auth, admin_management, admin_roles, publish, stubs

app = FastAPI(title="Flycatch API", version="2.0.0", docs_url="/api/docs", openapi_url="/openapi.json")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


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
app.include_router(publish.router, prefix="/api/v1")
app.include_router(stubs.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
