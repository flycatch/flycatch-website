from pathlib import Path

import yaml
from fastapi.testclient import TestClient

from flycatch_api.main import app

SPECS = Path(__file__).resolve().parents[4] / "specs"
CONTRACT_FILES = [
    SPECS / "002-auth-rbac" / "contracts" / "admin-auth.v2.yaml",
    SPECS / "002-auth-rbac" / "contracts" / "admin-rbac.v1.yaml",
    SPECS / "002-auth-rbac" / "contracts" / "admin-management.v2.yaml",
    SPECS / "002-auth-rbac" / "contracts" / "admin-roles.v1.yaml",
    SPECS / "002-auth-rbac" / "contracts" / "publish.v2.yaml",
    SPECS / "004-admin-blogs" / "contracts" / "admin-blogs.v1.yaml",
    SPECS / "004-admin-blogs" / "contracts" / "public-blogs.v1.yaml",
]


def _contract_paths() -> set[str]:
    paths: set[str] = set()
    for path in CONTRACT_FILES:
        spec = yaml.safe_load(path.read_text())
        for item in spec.get("paths", {}):
            paths.add(item)
    return paths


def test_openapi_served():
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "Flycatch API" in response.json()["info"]["title"]


def test_openapi_includes_contract_paths():
    client = TestClient(app)
    served = client.get("/openapi.json").json()
    served_paths = set(served.get("paths", {}))
    for path in _contract_paths():
        assert f"/api/v1{path}" in served_paths, f"missing {path}"
    assert "/api/v1/admin/csrf" not in served_paths
    assert "/api/v1/admin/auth/refresh" in served_paths
    assert "/api/v1/admin/auth/sign-in" in served_paths
