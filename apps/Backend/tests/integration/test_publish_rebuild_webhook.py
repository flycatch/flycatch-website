import httpx

from flycatch_api.services import frontend_rebuild as rebuild


def _bearer(client, email, password):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": email, "password": password},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_publish_posts_frontend_rebuild_webhook(client, bootstrapped, seeded_records, monkeypatch):
    captured: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        captured.append(request)
        return httpx.Response(204)

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(rebuild.settings, "frontend_rebuild_webhook_url", "https://hooks.example/rebuild")
    monkeypatch.setattr(rebuild.settings, "frontend_rebuild_webhook_token", "dispatch-token")
    monkeypatch.setattr(rebuild.settings, "frontend_rebuild_cooldown_seconds", 0)
    monkeypatch.setattr(rebuild, "_last_trigger_at", 0.0)

    def post(url, **kwargs):
        with httpx.Client(transport=transport) as http:
            return http.post(url, **kwargs)

    monkeypatch.setattr(httpx, "post", post)

    headers = _bearer(client, bootstrapped["admin_email"], bootstrapped["admin_password"])
    page = client.get("/api/v1/admin/pages/home", headers=headers)
    assert page.status_code == 200
    assert client.patch("/api/v1/admin/pages/home", headers=headers, json=page.json()["draft"]).status_code == 200
    publish = client.post(
        "/api/v1/admin/publish",
        headers=headers,
        json={"type": "page", "slug": "home"},
    )
    assert publish.status_code == 200
    assert captured, "publish must notify the frontend rebuild webhook"
    request = captured[0]
    assert str(request.url) == "https://hooks.example/rebuild"
    assert request.headers["Authorization"] == "Bearer dispatch-token"
    assert b"frontend-rebuild" in request.content
