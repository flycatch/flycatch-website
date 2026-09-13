from fastapi.testclient import TestClient

from flycatch_api.config import settings
from flycatch_api.security.rate_limit import limiter


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_privacy_and_terms_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/privacy-policies",
        headers=headers,
        json={"title": "Hidden Policy", "slug": "hidden-policy", "body": "<p>Draft</p>"},
    )
    assert draft.status_code == 201, draft.text
    published = client.post(
        "/api/v1/admin/privacy-policies",
        headers=headers,
        json={
            "title": "Privacy Policy",
            "slug": "privacy-policy",
            "body": "<p>Visible</p>",
            "status": "publish",
            "seo": {"title": "Privacy", "canonical_url": "https://www.flycatchtech.com/privacy-policy"},
        },
    )
    assert published.status_code == 201, published.text
    assert published.json()["seo"]["title"] == "Privacy"

    listed = client.get("/api/v1/public/privacy-policies")
    assert listed.status_code == 200
    slugs = [item["slug"] for item in listed.json()["items"]]
    assert slugs == ["privacy-policy"]

    live = client.get("/api/v1/public/privacy-policies/privacy-policy")
    assert live.status_code == 200
    assert live.json()["title"] == "Privacy Policy"
    assert live.json()["seo"]["canonical_url"].endswith("/privacy-policy")

    hidden = client.get("/api/v1/public/privacy-policies/hidden-policy")
    assert hidden.status_code == 404

    terms = client.post(
        "/api/v1/admin/terms",
        headers=headers,
        json={"title": "Terms", "slug": "terms-and-conditions", "status": "publish", "body": "<p>Rules</p>"},
    )
    assert terms.status_code == 201, terms.text
    public_terms = client.get("/api/v1/public/terms/terms-and-conditions")
    assert public_terms.status_code == 200
    assert public_terms.json()["title"] == "Terms"


def test_public_contact_and_application_reads_are_removed(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    client.post(
        "/api/v1/admin/contacts",
        headers=headers,
        json={"name": "Ada", "email": "ada@example.com", "status": "publish"},
    )
    client.post(
        "/api/v1/admin/applications",
        headers=headers,
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "status": "publish",
        },
    )
    assert client.get("/api/v1/public/contacts").status_code in {404, 405}
    assert client.get("/api/v1/public/applications").status_code in {404, 405}


def test_unlisted_origin_is_rejected_and_known_origin_is_allowed(client):
    denied = client.options(
        "/api/v1/public/news",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in {key.lower() for key in denied.headers}

    allowed_origin = settings.public_origin
    allowed = client.options(
        "/api/v1/public/news",
        headers={"Origin": allowed_origin, "Access-Control-Request-Method": "GET"},
    )
    assert allowed.headers.get("access-control-allow-origin") == allowed_origin


def test_public_write_rate_limit_rejects_burst(client, monkeypatch):
    limiter._hits.clear()
    monkeypatch.setattr(settings, "public_write_rate_limit", 2)
    monkeypatch.setattr(settings, "public_write_rate_window_seconds", 60)

    first = client.post("/api/v1/public/subscriptions", json={"email": "one@example.com"})
    second = client.post("/api/v1/public/subscriptions", json={"email": "two@example.com"})
    third = client.post("/api/v1/public/subscriptions", json={"email": "three@example.com"})
    assert first.status_code == 201, first.text
    assert second.status_code == 201, second.text
    assert third.status_code == 429
    assert third.json()["code"] == "rate_limited"
    limiter._hits.clear()
