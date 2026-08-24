from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_solution_products_are_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/solution-products",
        headers=headers,
        json={"product_title": "Hidden Product", "slug": "hidden-product", "status": "draft"},
    )
    published = client.post(
        "/api/v1/admin/solution-products",
        headers=headers,
        json={
            "product_title": "Live Product",
            "slug": "live-product",
            "product_tag": "Core",
            "status": "publish",
        },
    )
    assert draft.status_code == 201
    assert published.status_code == 201

    listed = client.get("/api/v1/public/solution-products")
    assert listed.status_code == 200
    slugs = [item["slug"] for item in listed.json()["items"]]
    assert "live-product" in slugs
    assert "hidden-product" not in slugs

    live = client.get("/api/v1/public/solution-products/live-product")
    assert live.status_code == 200
    assert live.json()["product_title"] == "Live Product"
    assert "status" not in live.json()
    assert "id" not in live.json()

    hidden = client.get("/api/v1/public/solution-products/hidden-product")
    assert hidden.status_code == 404
