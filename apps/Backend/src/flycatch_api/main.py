from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from flycatch_api.api import admin_auth, admin_management, publish, stubs

app = FastAPI(title="Flycatch API", version="1.0.0", docs_url="/api/docs", openapi_url="/openapi.json")


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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = FastAPI(title="Flycatch API v1")
api_v1.include_router(admin_auth.router)
api_v1.include_router(admin_management.router)
api_v1.include_router(publish.router)
api_v1.include_router(stubs.router)

app.mount("/api/v1", api_v1)


@app.get("/health")
def health():
    return {"status": "ok"}
