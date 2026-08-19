from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _create_case_study(client, headers, **fields):
    payload = {
        "heading": "Public Study",
        "slug": "public-study",
        "short_heading": "Public",
        "description": "Visible on the site",
        "body": "<p>Hello public</p>",
        "order": 1,
        "date": "2026-02-01",
        "status": "publish",
        "image_key": None,
        "image_alt": "Hero",
        "industry_ids": [],
        "category_ids": [],
    }
    payload.update(fields)
    return client.post("/api/v1/admin/case-studies", headers=headers, json=payload)


def test_public_list_and_detail_are_unauthenticated(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    industry = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Finance", "status": "publish"},
    )
    draft_industry = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Hidden Industry", "status": "draft"},
    )
    category = client.post(
        "/api/v1/admin/case-study-categories",
        headers=headers,
        json={"name": "Migration", "status": "publish"},
    )
    created = _create_case_study(
        client,
        headers,
        industry_ids=[industry.json()["id"], draft_industry.json()["id"]],
        category_ids=[category.json()["id"]],
    )
    assert created.status_code == 201

    listed = client.get("/api/v1/public/case-studies")
    assert listed.status_code == 200
    body = listed.json()
    assert body["per_page"] == 10
    assert body["total"] == 1
    item = body["items"][0]
    assert item["slug"] == "public-study"
    assert item["heading"] == "Public Study"
    assert item["order"] == 1
    assert item["date"] == "2026-02-01"
    assert [row["name"] for row in item["industries"]] == ["Finance"]
    assert item["categories"][0]["name"] == "Migration"
    assert "state" not in item
    assert "status" not in item

    detail = client.get("/api/v1/public/case-studies/public-study")
    assert detail.status_code == 200
    study = detail.json()
    assert study["body"] == "<p>Hello public</p>"
    assert study["content_available_in"] == ["en"]
    assert "status" not in study
    assert "industry_ids" not in study
    assert "category_ids" not in study


def test_drafts_are_hidden_from_public_list_and_detail(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = _create_case_study(
        client, headers, heading="Hidden", slug="hidden-draft", status="draft"
    )
    assert draft.status_code == 201
    published = _create_case_study(
        client, headers, heading="Live", slug="live-study", status="publish"
    )
    assert published.status_code == 201

    listed = client.get("/api/v1/public/case-studies")
    assert listed.status_code == 200
    slugs = [item["slug"] for item in listed.json()["items"]]
    assert "live-study" in slugs
    assert "hidden-draft" not in slugs

    missing = client.get("/api/v1/public/case-studies/hidden-draft")
    assert missing.status_code == 404
    assert missing.json() == {"code": "not_found", "message_key": "public.case_studies.not_found"}


def test_public_search_matches_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    industry = client.post(
        "/api/v1/admin/industries",
        headers=headers,
        json={"name": "Search Industry", "status": "publish"},
    )
    industry_id = industry.json()["id"]
    draft = _create_case_study(
        client,
        headers,
        heading="Draft Match",
        slug="draft-match",
        status="draft",
        industry_ids=[industry_id],
    )
    published = _create_case_study(
        client,
        headers,
        heading="Published Match",
        slug="published-match",
        status="publish",
        industry_ids=[industry_id],
    )
    other = _create_case_study(
        client,
        headers,
        heading="Other Live",
        slug="other-live",
        status="publish",
    )
    assert draft.status_code == 201
    assert published.status_code == 201
    assert other.status_code == 201

    search = client.get("/api/v1/public/case-studies?q=Search Industry")
    assert search.status_code == 200
    body = search.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "published-match"
