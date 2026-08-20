from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_client_logos_are_rejected(client):
    response = client.get("/api/v1/admin/client-logos")
    assert response.status_code == 401


def test_client_logo_crud_search_pagination_and_publish(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/client-logos",
        headers=headers,
        json={"alt_text": "Acme", "colour_logo_key": "media/colour.png"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "draft"
    assert body["alt_text"] == "Acme"
    logo_id = body["id"]

    listed = client.get("/api/v1/admin/client-logos", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["state"] == "draft"
    assert listed.json()["items"][0]["alt_text"] == "Acme"

    published = client.patch(
        f"/api/v1/admin/client-logos/{logo_id}",
        headers=headers,
        json={
            "alt_text": "Acme",
            "colour_logo_key": "media/colour.png",
            "white_logo_key": "media/white.png",
            "status": "publish",
        },
    )
    assert published.status_code == 200
    assert published.json()["status"] == "publish"

    unpublished = client.patch(
        f"/api/v1/admin/client-logos/{logo_id}",
        headers=headers,
        json={"alt_text": "Acme", "status": "draft"},
    )
    assert unpublished.json()["status"] == "draft"

    client.patch(
        f"/api/v1/admin/client-logos/{logo_id}",
        headers=headers,
        json={"alt_text": "Acme Corp", "status": "publish"},
    )
    search = client.get("/api/v1/admin/client-logos?q=Corp", headers=headers)
    assert search.status_code == 200
    assert search.json()["total"] == 1

    for index in range(10):
        extra = client.post(
            "/api/v1/admin/client-logos",
            headers=headers,
            json={"alt_text": f"Logo {index}"},
        )
        assert extra.status_code == 201
    page_two = client.get("/api/v1/admin/client-logos?page=2", headers=headers)
    assert page_two.status_code == 200
    assert page_two.json()["page"] == 2
    assert page_two.json()["total"] == 11
    assert len(page_two.json()["items"]) == 1

    deleted = client.delete(f"/api/v1/admin/client-logos/{logo_id}", headers=headers)
    assert deleted.status_code == 204
    missing = client.get(f"/api/v1/admin/client-logos/{logo_id}", headers=headers)
    assert missing.status_code == 404
    assert missing.json()["message_key"] == "admin.client_logos.not_found"


def test_client_logo_alt_text_required(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    response = client.post(
        "/api/v1/admin/client-logos",
        headers=headers,
        json={"alt_text": "   "},
    )
    assert response.status_code == 422
