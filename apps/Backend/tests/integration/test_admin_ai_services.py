from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_ai_services_are_rejected(client):
    response = client.get("/api/v1/admin/ai-services")
    assert response.status_code == 401


def test_ai_service_crud_solutions_and_public(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    detail = client.post(
        "/api/v1/admin/solution-details",
        headers=headers,
        json={
            "title": "Vision Detail",
            "slug": "vision-detail",
            "banner": {"title": "Vision"},
            "status": "publish",
        },
    )
    assert detail.status_code == 201, detail.text
    detail_id = detail.json()["id"]

    created = client.post(
        "/api/v1/admin/ai-services",
        headers=headers,
        json={
            "banner_title": "AI Lab",
            "introduction_title": "Intro",
            "ai_expertise_accordion": [
                {"title": "ML", "contents": "<p>Models</p><script>x</script>", "order": 0}
            ],
            "solution_ids": [detail_id],
            "faq_description": "<p>Help</p><script>x</script>",
            "faq_accordion": [
                {"title": "What", "contents": "<p>Answer</p><script>x</script>", "order": 0}
            ],
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["status"] == "draft"
    assert body["slug"] == "ai-lab"
    assert "<script>" not in body["ai_expertise_accordion"][0]["contents"]
    assert "<script>" not in body["faq_description"]
    assert "<script>" not in body["faq_accordion"][0]["contents"]
    assert body["solution_ids"] == [detail_id]
    entry_id = body["id"]

    listed = client.get("/api/v1/admin/ai-services?q=Lab", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["introduction_title"] == "Intro"

    hidden = client.get("/api/v1/public/ai-services/ai-lab")
    assert hidden.status_code == 404

    published = client.patch(
        f"/api/v1/admin/ai-services/{entry_id}",
        headers=headers,
        json={
            "banner_title": "AI Lab",
            "introduction_title": "Intro",
            "solution_ids": [detail_id],
            "status": "publish",
        },
    )
    assert published.status_code == 200
    live = client.get("/api/v1/public/ai-services/ai-lab")
    assert live.status_code == 200
    assert "status" not in live.json()
    assert live.json()["solutions"][0]["banner"]["title"] == "Vision"

    deleted = client.delete(f"/api/v1/admin/ai-services/{entry_id}", headers=headers)
    assert deleted.status_code == 204
