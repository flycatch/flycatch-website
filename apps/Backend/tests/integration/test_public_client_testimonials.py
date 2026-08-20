from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_client_testimonials_are_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/client-testimonials",
        headers=headers,
        json={
            "client_name": "Hidden",
            "title": "Draft title",
            "review": "Secret",
            "status": "draft",
            "order": 0,
        },
    )
    first = client.post(
        "/api/v1/admin/client-testimonials",
        headers=headers,
        json={
            "client_name": "Later",
            "title": "Second",
            "review": "Second review",
            "status": "publish",
            "order": 2,
        },
    )
    second = client.post(
        "/api/v1/admin/client-testimonials",
        headers=headers,
        json={
            "client_name": "Earlier",
            "title": "First",
            "review": "First review",
            "status": "publish",
            "order": 1,
        },
    )
    assert draft.status_code == 201
    assert first.status_code == 201
    assert second.status_code == 201

    listed = client.get("/api/v1/public/client-testimonials")
    assert listed.status_code == 200
    items = listed.json()["items"]
    names = [item["client_name"] for item in items]
    assert names == ["Earlier", "Later"]
    assert "Hidden" not in names
    assert items[0]["content_available_in"] == ["en"]
    assert "status" not in items[0]
    assert "id" not in items[0]
