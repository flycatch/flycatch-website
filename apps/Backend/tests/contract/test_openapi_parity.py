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
    SPECS / "005-admin-case-studies" / "contracts" / "admin-case-studies.v1.yaml",
    SPECS / "005-admin-case-studies" / "contracts" / "public-case-studies.v1.yaml",
    SPECS / "008-admin-home" / "contracts" / "admin-homes.v1.yaml",
    SPECS / "008-admin-home" / "contracts" / "public-homes.v1.yaml",
    SPECS / "012-admin-ai-services" / "contracts" / "admin-ai-services.v1.yaml",
    SPECS / "012-admin-ai-services" / "contracts" / "public-ai-services.v1.yaml",
    SPECS / "013-admin-cloud-services" / "contracts" / "admin-cloud-services.v1.yaml",
    SPECS / "013-admin-cloud-services" / "contracts" / "public-cloud-services.v1.yaml",
    SPECS / "014-admin-data-analytics" / "contracts" / "admin-data-analytics.v1.yaml",
    SPECS / "014-admin-data-analytics" / "contracts" / "public-data-analytics.v1.yaml",
    SPECS / "015-admin-digital-transformation" / "contracts" / "admin-digital-transformation.v1.yaml",
    SPECS / "015-admin-digital-transformation" / "contracts" / "public-digital-transformation.v1.yaml",
    SPECS / "016-admin-devops-consult" / "contracts" / "admin-devops-consult.v1.yaml",
    SPECS / "016-admin-devops-consult" / "contracts" / "public-devops-consult.v1.yaml",
    SPECS / "017-admin-infrastructure-management" / "contracts" / "admin-infrastructure-management.v1.yaml",
    SPECS / "017-admin-infrastructure-management" / "contracts" / "public-infrastructure-management.v1.yaml",
    SPECS / "018-admin-application-development" / "contracts" / "admin-application-development.v1.yaml",
    SPECS / "018-admin-application-development" / "contracts" / "public-application-development.v1.yaml",
    SPECS / "019-admin-application-modernization" / "contracts" / "admin-application-modernization.v1.yaml",
    SPECS / "019-admin-application-modernization" / "contracts" / "public-application-modernization.v1.yaml",
    SPECS / "020-admin-mobile-application-development" / "contracts" / "admin-mobile-application-development.v1.yaml",
    SPECS / "020-admin-mobile-application-development" / "contracts" / "public-mobile-application-development.v1.yaml",
    SPECS / "021-admin-user-centered-design" / "contracts" / "admin-user-centered-design.v1.yaml",
    SPECS / "021-admin-user-centered-design" / "contracts" / "public-user-centered-design.v1.yaml",
    SPECS / "022-admin-overview" / "contracts" / "admin-overview.v1.yaml",
    SPECS / "022-admin-overview" / "contracts" / "public-overview.v1.yaml",
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
