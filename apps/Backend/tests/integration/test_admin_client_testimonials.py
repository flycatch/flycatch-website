from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_client_testimonials_are_rejected(client):
    response = client.get("/api/v1/admin/client-testimonials")
    assert response.status_code == 401


def test_client_testimonial_crud_search_pagination_and_publish(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/client-testimonials",
        headers=headers,
        json={
            "client_name": "Jane Doe",
            "title": "Great partner",
            "review": "They delivered on time.",
            "client_designation": "CTO",
            "client_company": "Acme",
            "country": "US",
            "order": 2,
        },
    )
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "draft"
    assert body["content_available_in"] == ["en"]
    assert body["is_clutch_review"] is False
    assert body["order"] == 2
    testimonial_id = body["id"]

    listed = client.get("/api/v1/admin/client-testimonials", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["content_available_in"] == "En"
    assert listed.json()["items"][0]["state"] == "draft"

    published = client.patch(
        f"/api/v1/admin/client-testimonials/{testimonial_id}",
        headers=headers,
        json={
            "client_name": "Jane Doe",
            "title": "Great partner",
            "review": "They delivered on time.",
            "is_clutch_review": True,
            "order": 1,
            "review_link": "https://clutch.co/example",
            "status": "publish",
        },
    )
    assert published.status_code == 200
    assert published.json()["status"] == "publish"
    assert published.json()["is_clutch_review"] is True

    unpublished = client.patch(
        f"/api/v1/admin/client-testimonials/{testimonial_id}",
        headers=headers,
        json={
            "client_name": "Jane Doe",
            "title": "Great partner",
            "review": "They delivered on time.",
            "status": "draft",
        },
    )
    assert unpublished.json()["status"] == "draft"

    search = client.get("/api/v1/admin/client-testimonials?q=Jane", headers=headers)
    assert search.json()["total"] == 1

    for index in range(10):
        extra = client.post(
            "/api/v1/admin/client-testimonials",
            headers=headers,
            json={
                "client_name": f"Client {index}",
                "title": f"Title {index}",
                "review": f"Review {index}",
                "order": index + 10,
            },
        )
        assert extra.status_code == 201
    page_two = client.get("/api/v1/admin/client-testimonials?page=2", headers=headers)
    assert page_two.status_code == 200
    assert page_two.json()["total"] == 11
    assert len(page_two.json()["items"]) == 1

    deleted = client.delete(
        f"/api/v1/admin/client-testimonials/{testimonial_id}", headers=headers
    )
    assert deleted.status_code == 204


def test_client_testimonial_rejects_negative_order(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    response = client.post(
        "/api/v1/admin/client-testimonials",
        headers=headers,
        json={
            "client_name": "Pat",
            "title": "Note",
            "review": "Text",
            "order": -1,
        },
    )
    assert response.status_code == 422
