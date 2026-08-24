from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_solution_details_are_rejected(client):
    response = client.get("/api/v1/admin/solution-details")
    assert response.status_code == 401


def test_solution_detail_crud_slug_and_nested(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/solution-details",
        headers=headers,
        json={
            "title": "Retail Ops",
            "slug": "retail-ops",
            "banner": {"title": "Retail", "industry_type": "Commerce"},
            "introduction": {
                "items": [
                    {
                        "title": "Scale",
                        "order": 1,
                        "color": "#112233",
                    }
                ],
                "description": "Plain",
                "sub_description": "<p>Grow</p><script>x</script>",
            },
            "challenges": {
                "items": [
                    {
                        "title": "Legacy",
                        "order": 0,
                    }
                ],
                "description": "<p>Old stack</p>",
                "name": "Ada",
                "position": "CTO",
                "types": [{"title": "Cloud", "order": 0, "description": "<p>Lift</p>"}],
            },
            "benefits": {
                "description": "Faster",
                "items": [{"title": "Speed", "order": 0}],
                "types": [{"title": "Uptime", "order": 1, "description": "<p>More</p>"}],
            },
            "solutions_section": {"title": "Related", "image_key": None, "description": "More"},
            "cta": {"title": "Talk", "description": "Reach out", "button_name": "Contact"},
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["status"] == "draft"
    assert body["slug"] == "retail-ops"
    assert "<script>" not in body["introduction"]["sub_description"]
    assert body["introduction"]["description"] == "Plain"
    assert body["challenges"]["name"] == "Ada"
    assert body["challenges"]["types"][0]["title"] == "Cloud"
    assert "types" not in body["challenges"]["items"][0]
    assert body["benefits"]["types"][0]["title"] == "Uptime"
    assert "title" not in body["benefits"]
    assert body["cta"]["button_name"] == "Contact"
    detail_id = body["id"]

    listed = client.get("/api/v1/admin/solution-details?q=Retail", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["banner_title"] == "Retail"
    assert listed.json()["items"][0]["challenges_title"] == "Legacy"

    duplicate = client.post(
        "/api/v1/admin/solution-details",
        headers=headers,
        json={"title": "Other", "slug": "retail-ops"},
    )
    assert duplicate.status_code == 422

    published = client.patch(
        f"/api/v1/admin/solution-details/{detail_id}",
        headers=headers,
        json={"title": "Retail Ops", "slug": "retail-ops", "status": "publish"},
    )
    assert published.status_code == 200
    assert published.json()["status"] == "publish"

    deleted = client.delete(f"/api/v1/admin/solution-details/{detail_id}", headers=headers)
    assert deleted.status_code == 204


def test_solution_detail_rejects_negative_order_and_invalid_media(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    negative = client.post(
        "/api/v1/admin/solution-details",
        headers=headers,
        json={
            "title": "Bad order",
            "introduction": {"items": [{"title": "A", "order": -1}]},
        },
    )
    assert negative.status_code == 422

    invalid_media = client.post(
        "/api/v1/admin/solution-details",
        headers=headers,
        json={
            "title": "Bad media",
            "banner": {"image_key": "not a key", "title": "X"},
        },
    )
    assert invalid_media.status_code == 422
