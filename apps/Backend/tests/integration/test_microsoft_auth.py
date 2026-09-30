from datetime import UTC, datetime
from urllib.parse import parse_qs, urlparse

from flycatch_api.config import settings
from flycatch_api.models import Administrator, AdministratorRole, Role
from flycatch_api.services.microsoft_auth import MicrosoftAuthService


def _configure(monkeypatch):
    monkeypatch.setattr(settings, "azure_ad_tenant_id", "tenant-id")
    monkeypatch.setattr(settings, "azure_ad_client_id", "client-id")
    monkeypatch.setattr(settings, "azure_ad_client_secret", "client-secret")
    monkeypatch.setattr(
        settings,
        "azure_ad_redirect_uri",
        "http://localhost:8080/api/v1/admin/auth/microsoft/callback",
    )
    monkeypatch.setattr(settings, "allowed_email_domain", "flycatchtech.com")
    monkeypatch.setattr(settings, "public_origin", "http://localhost:8080")
    monkeypatch.setattr(settings, "session_secret", "test-session-secret")


def _clear(monkeypatch):
    for name in (
        "azure_ad_tenant_id",
        "azure_ad_client_id",
        "azure_ad_client_secret",
        "azure_ad_redirect_uri",
    ):
        monkeypatch.setattr(settings, name, "")


def test_app_starts_when_azure_is_unset(client, monkeypatch):
    _clear(monkeypatch)
    assert client.get("/health").status_code == 200
    probe = client.get("/api/v1/admin/auth/microsoft", params={"probe": "1"})
    assert probe.status_code == 200
    assert probe.json() == {"configured": False}
    start = client.get("/api/v1/admin/auth/microsoft", follow_redirects=False)
    assert start.status_code == 302
    assert "admin.sign_in.error" in start.headers["location"]
    assert "set-cookie" not in start.headers


def test_start_sets_state_cookie_and_redirects(client, monkeypatch):
    _configure(monkeypatch)
    response = client.get("/api/v1/admin/auth/microsoft", follow_redirects=False)
    assert response.status_code == 302
    location = response.headers["location"]
    assert "login.microsoftonline.com" in location
    assert "/tenant-id/oauth2/v2.0/authorize" in location
    assert "code_challenge=" in location
    assert "code_challenge_method=S256" in location
    cookie = response.headers["set-cookie"]
    assert "admin_microsoft_state=" in cookie
    assert "HttpOnly" in cookie
    assert "Path=/api/v1/admin/auth/microsoft" in cookie
    assert "Max-Age=600" in cookie


def test_callback_issues_admin_token_and_refuses_roleless_account(
    client, bootstrapped, db, monkeypatch
):
    _configure(monkeypatch)
    role = db.query(Role).filter_by(name="administrator").one()
    seeded = Administrator(
        email="liju@flycatchtech.com",
        password_hash=None,
        is_active=True,
        created_at=datetime.now(UTC),
        created_by="microsoft-seed",
    )
    db.add(seeded)
    db.flush()
    db.add(
        AdministratorRole(
            administrator_id=seeded.id,
            role_id=role.id,
            assigned_at=datetime.now(UTC),
            assigned_by="microsoft-seed",
        )
    )
    db.commit()

    def exchange(self, code, verifier, nonce):
        if code == "liju-code":
            return {"oid": "oid-liju", "email": "Liju@Flycatchtech.com"}
        return {"oid": "oid-other", "email": "other@flycatchtech.com"}

    monkeypatch.setattr(MicrosoftAuthService, "exchange_identity", exchange)

    def callback(code: str):
        start = client.get("/api/v1/admin/auth/microsoft", follow_redirects=False)
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
        return client.get(
            "/api/v1/admin/auth/microsoft/callback",
            params={"code": code, "state": state},
            follow_redirects=False,
        )

    liju = callback("liju-code")
    assert liju.status_code == 302
    parsed = urlparse(liju.headers["location"])
    assert parsed.path == "/admin/sign-in/microsoft/"
    assert "access_token" not in parsed.query
    fragment = parse_qs(parsed.fragment)
    access = fragment["access_token"][0]
    assert fragment["refresh_token"][0]
    allowed = client.get("/api/v1/admin/roles", headers={"Authorization": f"Bearer {access}"})
    assert allowed.status_code == 200

    other = callback("other-code")
    other_access = parse_qs(urlparse(other.headers["location"]).fragment)["access_token"][0]
    refused = client.get("/api/v1/admin/roles", headers={"Authorization": f"Bearer {other_access}"})
    assert refused.status_code == 403
    assert db.query(Administrator).filter_by(email="other@flycatchtech.com").count() == 1


def test_tampered_state_issues_no_session(client, db, monkeypatch):
    _configure(monkeypatch)
    start = client.get("/api/v1/admin/auth/microsoft", follow_redirects=False)
    assert start.status_code == 302
    before = db.query(Administrator).count()
    callback = client.get(
        "/api/v1/admin/auth/microsoft/callback",
        params={"code": "abc", "state": "not-the-state"},
        follow_redirects=False,
    )
    assert callback.status_code == 302
    location = callback.headers["location"]
    assert "admin.sign_in.error" in location
    assert "access_token" not in location
    assert db.query(Administrator).count() == before


def test_null_password_hash_is_generic_failure(client, bootstrapped, db):
    from flycatch_api.models import Administrator as Admin

    admin = db.query(Admin).filter_by(email=bootstrapped["admin_email"]).one()
    admin.password_hash = None
    db.commit()
    response = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    )
    unknown = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": "missing@example.com", "password": "administrator-pass"},
    )
    assert response.status_code == 401
    assert response.json() == unknown.json()
    assert response.json()["message_key"] == "admin.sign_in.error"
