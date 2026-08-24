from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_solutions_are_rejected(client):
    response = client.get("/api/v1/admin/solutions")
    assert response.status_code == 401


def test_solution_crud_search_pagination_and_publish(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/solutions",
        headers=headers,
        json={"banner_title": "Platforms", "section_title": "What we build"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "draft"
    assert body["seo"]["title"] == ""
    solution_id = body["id"]

    listed = client.get("/api/v1/admin/solutions", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["state"] == "draft"
    assert listed.json()["items"][0]["banner_title"] == "Platforms"

    published = client.patch(
        f"/api/v1/admin/solutions/{solution_id}",
        headers=headers,
        json={
            "banner_title": "Platforms",
            "section_title": "What we build",
            "status": "publish",
            "seo": {"title": "Solutions SEO", "description": "Desc", "canonical_url": "/", "meta_title": "Meta"},
        },
    )
    assert published.status_code == 200
    assert published.json()["status"] == "publish"
    assert published.json()["seo"]["title"] == "Solutions SEO"

    unpublished = client.patch(
        f"/api/v1/admin/solutions/{solution_id}",
        headers=headers,
        json={"banner_title": "Platforms", "status": "draft"},
    )
    assert unpublished.json()["status"] == "draft"

    client.patch(
        f"/api/v1/admin/solutions/{solution_id}",
        headers=headers,
        json={"banner_title": "Platforms Corp", "status": "publish"},
    )
    search = client.get("/api/v1/admin/solutions?q=Corp", headers=headers)
    assert search.status_code == 200
    assert search.json()["total"] == 1

    for index in range(10):
        extra = client.post(
            "/api/v1/admin/solutions",
            headers=headers,
            json={"banner_title": f"Solution {index}"},
        )
        assert extra.status_code == 201
    page_two = client.get("/api/v1/admin/solutions?page=2", headers=headers)
    assert page_two.status_code == 200
    assert page_two.json()["total"] == 11
    assert len(page_two.json()["items"]) == 1

    deleted = client.delete(f"/api/v1/admin/solutions/{solution_id}", headers=headers)
    assert deleted.status_code == 204
