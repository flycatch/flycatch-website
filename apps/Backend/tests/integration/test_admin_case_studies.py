from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _headers(client, email, password):
    tokens = _sign_in(client, email, password).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _admin(client, bootstrapped):
    return _headers(client, bootstrapped["admin_email"], bootstrapped["admin_password"])


def _editor(client, bootstrapped):
    return _headers(client, bootstrapped["editor_email"], bootstrapped["editor_password"])


def test_unauthenticated_case_studies_are_rejected(client):
    response = client.get("/api/v1/admin/case-studies")
    assert response.status_code == 401


def test_industry_category_and_case_study_crud(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    industry = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Healthcare", "status": "draft"},
    )
    assert industry.status_code == 201
    industry_id = industry.json()["id"]
    assert industry.json()["status"] == "draft"

    published_industry = client.patch(
        f"/api/v1/admin/industries/{industry_id}",
        headers=headers,
        json={"name": "Healthcare", "status": "publish"},
    )
    assert published_industry.status_code == 200
    assert published_industry.json()["status"] == "publish"

    category = client.post(
        "/api/v1/admin/case-study-categories",
        headers=headers,
        json={"name": "Digital Transformation", "status": "draft"},
    )
    assert category.status_code == 201
    category_id = category.json()["id"]
    assert category.json()["case_studies"] == 0

    created = client.post(
        "/api/v1/admin/case-studies",
        headers=headers,
        json={
            "heading": "Hospital Portal",
            "slug": "hospital-portal",
            "short_heading": "Portal",
            "description": "A patient portal",
            "body": "<p>Hello</p>",
            "order": 2,
            "date": "2026-01-15",
            "status": "draft",
            "industry_ids": [industry_id],
            "category_ids": [category_id],
        },
    )
    assert created.status_code == 201
    case_study = created.json()
    assert case_study["slug"] == "hospital-portal"
    assert case_study["status"] == "draft"
    assert case_study["order"] == 2
    assert case_study["date"] == "2026-01-15"
    assert case_study["content_available_in"] == ["en"]
    assert case_study["industry_ids"] == [industry_id]
    assert case_study["category_ids"] == [category_id]

    listed = client.get("/api/v1/admin/case-studies", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["heading"] == "Hospital Portal"
    assert listed.json()["items"][0]["industry"] == "Healthcare"
    assert listed.json()["items"][0]["content_available_in"] == "En"
    assert listed.json()["items"][0]["state"] == "draft"

    categories = client.get("/api/v1/admin/case-study-categories", headers=headers)
    assert categories.status_code == 200
    match = next(item for item in categories.json()["items"] if item["id"] == category_id)
    assert match["case_studies"] == 1
    assert match["state"] == "draft"

    industries = client.get("/api/v1/admin/industries", headers=headers)
    assert any(item["name"] == "Healthcare" for item in industries.json()["items"])

    blocked_industry = client.delete(f"/api/v1/admin/industries/{industry_id}", headers=headers)
    assert blocked_industry.status_code == 409
    assert blocked_industry.json()["code"] == "in_use"
    blocked_category = client.delete(
        f"/api/v1/admin/case-study-categories/{category_id}", headers=headers
    )
    assert blocked_category.status_code == 409

    updated = client.patch(
        f"/api/v1/admin/case-studies/{case_study['id']}",
        headers=headers,
        json={
            "heading": "Hospital Portal",
            "slug": "hospital-portal",
            "status": "publish",
            "industry_ids": [industry_id],
            "category_ids": [category_id],
        },
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "publish"

    deleted = client.delete(f"/api/v1/admin/case-studies/{case_study['id']}", headers=headers)
    assert deleted.status_code == 204
    assert client.delete(f"/api/v1/admin/industries/{industry_id}", headers=headers).status_code == 204
    assert (
        client.delete(
            f"/api/v1/admin/case-study-categories/{category_id}", headers=headers
        ).status_code
        == 204
    )


def test_case_study_search_and_pagination(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    industry = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Search Industry"},
    )
    industry_id = industry.json()["id"]
    for index in range(11):
        created = client.post(
            "/api/v1/admin/case-studies",
            headers=headers,
            json={
                "heading": f"Study {index}",
                "slug": f"study-{index}",
                "status": "draft",
                "industry_ids": [industry_id] if index == 3 else [],
            },
        )
        assert created.status_code == 201
    page_one = client.get("/api/v1/admin/case-studies?page=1&per_page=10", headers=headers)
    assert page_one.status_code == 200
    body = page_one.json()
    assert body["per_page"] == 10
    assert body["total"] >= 11
    assert len(body["items"]) == 10
    page_two = client.get("/api/v1/admin/case-studies?page=2&per_page=10", headers=headers)
    assert page_two.status_code == 200
    assert page_two.json()["items"]
    search = client.get("/api/v1/admin/case-studies?q=Search Industry", headers=headers)
    assert search.status_code == 200
    assert search.json()["total"] == 1
    assert search.json()["items"][0]["heading"] == "Study 3"


def test_industry_and_category_search_pagination(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    for index in range(11):
        assert (
            client.post(
                "/api/v1/admin/industries",
                headers=headers,
                json={"name": f"Industry {index}"},
            ).status_code
            == 201
        )
        assert (
            client.post(
                "/api/v1/admin/case-study-categories",
                headers=headers,
                json={"name": f"Category {index}"},
            ).status_code
            == 201
        )
    industries = client.get("/api/v1/admin/industries?page=1&per_page=10", headers=headers)
    assert industries.json()["per_page"] == 10
    assert industries.json()["total"] >= 11
    assert len(industries.json()["items"]) == 10
    found = client.get("/api/v1/admin/industries?q=Industry 3", headers=headers)
    assert found.json()["total"] == 1
    categories = client.get("/api/v1/admin/case-study-categories?q=Category 3", headers=headers)
    assert categories.json()["total"] == 1


def test_duplicate_case_study_slug_is_rejected(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    first = client.post(
        "/api/v1/admin/case-studies",
        headers=headers,
        json={"heading": "Same", "slug": "same-case", "status": "draft"},
    )
    assert first.status_code == 201
    second = client.post(
        "/api/v1/admin/case-studies",
        headers=headers,
        json={"heading": "Other", "slug": "same-case", "status": "draft"},
    )
    assert second.status_code == 422
    assert (
        second.json()["detail"]["fields"]["slug"]["message_key"]
        == "admin.case_studies.slug.duplicate"
    )


def test_editor_can_write_case_studies(client, bootstrapped):
    headers = _editor(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/case-studies",
        headers=headers,
        json={"heading": "Editor Study", "slug": "editor-study", "status": "draft"},
    )
    assert created.status_code == 201
