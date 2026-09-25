from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_admin_industries_still_require_auth(client):
    response = client.get("/api/v1/admin/industries")
    assert response.status_code == 401


def test_public_industries_list_published_names_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    published = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Finance", "status": "publish"},
    )
    draft = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Hidden Industry", "status": "draft"},
    )
    later = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Healthcare", "status": "publish"},
    )
    assert published.status_code == 201
    assert draft.status_code == 201
    assert later.status_code == 201

    response = client.get("/api/v1/public/industries")
    assert response.status_code == 200
    items = response.json()["items"]
    assert [item["name"] for item in items] == ["Finance", "Healthcare"]
    assert items == [{"name": "Finance"}, {"name": "Healthcare"}]

    admin = client.get("/api/v1/admin/industries", headers=headers)
    assert admin.status_code == 200
    admin_names = {item["name"] for item in admin.json()["items"]}
    assert {"Finance", "Healthcare", "Hidden Industry"} <= admin_names
