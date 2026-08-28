from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_editor_cannot_publish_landing(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["editor_email"], bootstrapped["editor_password"]).json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = client.post(
        "/api/v1/admin/overview",
        headers=headers,
        json={"banner_title": "Editor Publish", "status": "publish"},
    )
    assert response.status_code == 403
    assert client.get("/api/v1/admin/devops-consult").status_code == 401
    assert client.get("/api/v1/admin/overview").status_code == 401


def test_landing_crud_publish_and_public(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/devops-consult",
        headers=headers,
        json={"banner_title": "Hidden Consult", "status": "draft"},
    )
    published = client.post(
        "/api/v1/admin/devops-consult",
        headers=headers,
        json={
            "banner_title": "Live Consult",
            "introduction_title": "Intro",
            "experience_accordion": [
                {"title": "One", "contents": "<p>Go</p><script>x</script>", "order": 0}
            ],
            "status": "publish",
        },
    )
    assert draft.status_code == 201, draft.text
    assert published.status_code == 201, published.text
    assert "<script>" not in published.json()["experience_accordion"][0]["contents"]
    listed = client.get("/api/v1/admin/devops-consult?q=Live", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["introduction_title"] == "Intro"

    public_list = client.get("/api/v1/public/devops-consult")
    slugs = [item["slug"] for item in public_list.json()["items"]]
    assert "live-consult" in slugs
    assert "hidden-consult" not in slugs
    assert client.get("/api/v1/public/devops-consult/hidden-consult").status_code == 404
    live = client.get("/api/v1/public/devops-consult/live-consult")
    assert live.status_code == 200
    assert "id" not in live.json()
    assert "status" not in live.json()

    overview = client.post(
        "/api/v1/admin/overview",
        headers=headers,
        json={"banner_title": "Company Overview", "status": "publish"},
    )
    assert overview.status_code == 201, overview.text
    assert client.get("/api/v1/public/overview/company-overview").status_code == 200

    app_dev = client.post(
        "/api/v1/admin/application-development",
        headers=headers,
        json={
            "banner_title": "Custom Apps",
            "introduction_first_paragraph": "A" * 120,
            "status": "publish",
        },
    )
    assert app_dev.status_code == 201, app_dev.text
    listed_dev = client.get("/api/v1/admin/application-development", headers=headers)
    item = listed_dev.json()["items"][0]
    assert item["content_available_in"] == "En"
    assert item["introduction_first_paragraph"].startswith("A")

    modern = client.post(
        "/api/v1/admin/application-modernization",
        headers=headers,
        json={
            "banner_title": "Modernize",
            "seo": {"title": "SEO Title", "description": "SEO Description"},
            "status": "publish",
        },
    )
    assert modern.status_code == 201, modern.text
    modern_list = client.get("/api/v1/admin/application-modernization", headers=headers)
    assert "SEO Title" in modern_list.json()["items"][0]["seo"]

    catalogue = client.get("/api/v1/admin/roles/catalogue", headers=headers)
    resources = {item["id"] for item in catalogue.json()["resources"]}
    for resource in [
        "devops_consult",
        "infrastructure_management",
        "application_development",
        "application_modernization",
        "mobile_application_development",
        "user_centered_design",
        "overview",
    ]:
        assert resource in resources
