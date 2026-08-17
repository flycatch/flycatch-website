from pathlib import Path

import yaml
from fastapi.testclient import TestClient

from flycatch_api.main import app

CONTRACTS = Path(__file__).resolve().parents[4] / "specs" / "002-auth-rbac" / "contracts"
OPENAPI_FILES = [
    "admin-auth.v2.yaml",
    "admin-rbac.v1.yaml",
    "admin-management.v2.yaml",
    "admin-roles.v1.yaml",
    "publish.v2.yaml",
]


def _contract_paths() -> set[str]:
    paths: set[str] = set()
    for name in OPENAPI_FILES:
        spec = yaml.safe_load((CONTRACTS / name).read_text())
        for path in spec.get("paths", {}):
            paths.add(path)
    return paths


def test_openapi_served():
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "Flycatch API" in response.json()["info"]["title"]


def test_openapi_includes_002_contract_paths():
    client = TestClient(app)
    served = client.get("/openapi.json").json()
    served_paths = set(served.get("paths", {}))
    for path in _contract_paths():
        assert f"/api/v1{path}" in served_paths, f"missing {path}"
    assert "/api/v1/admin/csrf" not in served_paths
    assert "/api/v1/admin/auth/refresh" in served_paths
    assert "/api/v1/admin/auth/sign-in" in served_paths
