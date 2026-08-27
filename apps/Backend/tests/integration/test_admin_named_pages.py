from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_cloud_and_data_page_name_uniqueness(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    first = client.post(
        "/api/v1/admin/cloud-services",
        headers=headers,
        json={"page_name": "cloud-services", "banner_title": "Cloud", "status": "publish"},
    )
    assert first.status_code == 201, first.text
    duplicate = client.post(
        "/api/v1/admin/cloud-services",
        headers=headers,
        json={"page_name": "cloud-services", "banner_title": "Other"},
    )
    assert duplicate.status_code == 422

    analytics = client.post(
        "/api/v1/admin/data-analytics",
        headers=headers,
        json={"page_name": "data-management", "banner_title": "Analytics", "status": "publish"},
    )
    assert analytics.status_code == 201, analytics.text

    listed = client.get("/api/v1/public/cloud-services")
    assert listed.status_code == 200
    names = [item["page_name"] for item in listed.json()["items"]]
    assert "cloud-services" in names

    detail = client.get("/api/v1/public/cloud-services/cloud-services")
    assert detail.status_code == 200
    assert "status" not in detail.json()
    assert detail.json()["banner_title"] == "Cloud"

    data_detail = client.get("/api/v1/public/data-analytics/data-management")
    assert data_detail.status_code == 200
    assert data_detail.json()["banner_title"] == "Analytics"


def test_digital_transformation_public_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/digital-transformation",
        headers=headers,
        json={"banner_title": "Hidden DT", "banner_tag_line": "Soon", "status": "draft"},
    )
    published = client.post(
        "/api/v1/admin/digital-transformation",
        headers=headers,
        json={
            "banner_title": "Live DT",
            "banner_tag_line": "Now",
            "accordion": [{"title": "One", "contents": "<p>Go</p><script>x</script>", "order": 0}],
            "status": "publish",
        },
    )
    assert draft.status_code == 201, draft.text
    assert published.status_code == 201, published.text
    assert "<script>" not in published.json()["accordion"][0]["contents"]

    listed = client.get("/api/v1/public/digital-transformation")
    slugs = [item["slug"] for item in listed.json()["items"]]
    assert "live-dt" in slugs
    assert "hidden-dt" not in slugs
    hidden = client.get("/api/v1/public/digital-transformation/hidden-dt")
    assert hidden.status_code == 404
    live = client.get("/api/v1/public/digital-transformation/live-dt")
    assert live.status_code == 200
    assert live.json()["banner_tag_line"] == "Now"
    assert "id" not in live.json()
