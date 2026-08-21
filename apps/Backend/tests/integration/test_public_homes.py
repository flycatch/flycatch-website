from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_homes_are_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/homes",
        headers=headers,
        json={"title": "Hidden", "status": "draft"},
    )
    first = client.post(
        "/api/v1/admin/homes",
        headers=headers,
        json={"title": "Later", "banner_title": "Second", "status": "publish"},
    )
    second = client.post(
        "/api/v1/admin/homes",
        headers=headers,
        json={"title": "Earlier", "banner_title": "First", "status": "publish"},
    )
    draft_study = client.post(
        "/api/v1/admin/case-studies",
        headers=headers,
        json={"heading": "Draft study", "slug": "draft-study", "status": "draft"},
    )
    industry = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Retail", "status": "publish"},
    )
    category = client.post(
        "/api/v1/admin/case-study-categories",
        headers=headers,
        json={"name": "Commerce", "status": "publish"},
    )
    tech = client.post(
        "/api/v1/admin/technologies",
        headers=headers,
        json={"name": "Python", "status": "publish"},
    )
    assert industry.status_code == 201
    assert category.status_code == 201
    assert tech.status_code == 201
    live_study = client.post(
        "/api/v1/admin/case-studies",
        headers=headers,
        json={
            "heading": "Live study",
            "slug": "live-study",
            "short_heading": "Live",
            "description": "A published win",
            "body": "<p>Full story</p>",
            "status": "publish",
            "industry_ids": [industry.json()["id"]],
            "category_ids": [category.json()["id"]],
            "technology_ids": [tech.json()["id"]],
        },
    )
    assert draft.status_code == 201
    assert first.status_code == 201
    assert second.status_code == 201
    assert draft_study.status_code == 201
    assert live_study.status_code == 201

    client.patch(
        f"/api/v1/admin/homes/{first.json()['id']}",
        headers=headers,
        json={
            "title": "Later",
            "status": "publish",
            "case_study_ids": [draft_study.json()["id"], live_study.json()["id"]],
        },
    )

    listed = client.get("/api/v1/public/homes")
    assert listed.status_code == 200
    items = listed.json()["items"]
    titles = [item["title"] for item in items]
    assert titles == ["Later", "Earlier"]
    assert "Hidden" not in titles
    assert "status" not in items[0]
    assert "id" not in items[0]
    assert items[0]["content_available_in"] == ["en"]
    later = next(item for item in items if item["title"] == "Later")
    assert len(later["case_studies"]) == 1
    study = later["case_studies"][0]
    assert study["heading"] == "Live study"
    assert study["slug"] == "live-study"
    assert study["short_heading"] == "Live"
    assert study["description"] == "A published win"
    assert study["body"] == "<p>Full story</p>"
    assert study["industries"] == [{"name": "Retail"}]
    assert study["categories"] == [{"name": "Commerce"}]
    assert study["technologies"][0]["name"] == "Python"
    assert "id" not in study
    assert "status" not in study
