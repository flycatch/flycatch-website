from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_solution_products_are_rejected(client):
    response = client.get("/api/v1/admin/solution-products")
    assert response.status_code == 401


def test_solution_product_crud_order_and_slug(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/solution-products",
        headers=headers,
        json={"product_title": "Analytics", "product_tag": "Data", "order": 2},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["status"] == "draft"
    assert body["slug"] == "analytics"
    assert body["order"] == 2
    product_id = body["id"]

    negative = client.post(
        "/api/v1/admin/solution-products",
        headers=headers,
        json={"product_title": "Bad", "order": -1},
    )
    assert negative.status_code == 422

    listed = client.get("/api/v1/admin/solution-products?q=Data", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["product_title"] == "Analytics"

    published = client.patch(
        f"/api/v1/admin/solution-products/{product_id}",
        headers=headers,
        json={
            "product_title": "Analytics",
            "slug": "analytics",
            "card_image_on_right": True,
            "status": "publish",
        },
    )
    assert published.status_code == 200
    assert published.json()["status"] == "publish"
    assert published.json()["card_image_on_right"] is True

    duplicate = client.post(
        "/api/v1/admin/solution-products",
        headers=headers,
        json={"product_title": "Other", "slug": "analytics"},
    )
    assert duplicate.status_code == 422

    deleted = client.delete(f"/api/v1/admin/solution-products/{product_id}", headers=headers)
    assert deleted.status_code == 204
