from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_client_logos_are_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/client-logos",
        headers=headers,
        json={"alt_text": "Hidden Logo", "status": "draft"},
    )
    published = client.post(
        "/api/v1/admin/client-logos",
        headers=headers,
        json={
            "alt_text": "Live Logo",
            "colour_logo_key": "media/live.png",
            "status": "publish",
        },
    )
    assert draft.status_code == 201
    assert published.status_code == 201

    listed = client.get("/api/v1/public/client-logos")
    assert listed.status_code == 200
    items = listed.json()["items"]
    alts = [item["alt_text"] for item in items]
    assert "Live Logo" in alts
    assert "Hidden Logo" not in alts
    live = next(item for item in items if item["alt_text"] == "Live Logo")
    assert live["colour_logo_key"] == "media/live.png"
    assert "status" not in live
    assert "state" not in live
    assert "id" not in live
