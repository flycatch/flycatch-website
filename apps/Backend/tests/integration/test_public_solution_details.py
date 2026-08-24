from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_solution_details_are_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/solution-details",
        headers=headers,
        json={"title": "Hidden Detail", "slug": "hidden-detail", "status": "draft"},
    )
    published = client.post(
        "/api/v1/admin/solution-details",
        headers=headers,
        json={"title": "Live Detail", "slug": "live-detail", "status": "publish"},
    )
    assert draft.status_code == 201
    assert published.status_code == 201

    listed = client.get("/api/v1/public/solution-details")
    assert listed.status_code == 200
    slugs = [item["slug"] for item in listed.json()["items"]]
    assert "live-detail" in slugs
    assert "hidden-detail" not in slugs

    live = client.get("/api/v1/public/solution-details/live-detail")
    assert live.status_code == 200
    assert live.json()["title"] == "Live Detail"
    assert "status" not in live.json()
    assert "id" not in live.json()
    assert "cta" in live.json()
    assert live.json()["seo"]["h1_tag"] == ""
    assert live.json()["seo"]["image_alt"] == ""

    hidden = client.get("/api/v1/public/solution-details/hidden-detail")
    assert hidden.status_code == 404
