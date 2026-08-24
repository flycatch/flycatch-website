from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_solutions_are_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = client.post(
        "/api/v1/admin/solutions",
        headers=headers,
        json={"banner_title": "Hidden", "status": "draft"},
    )
    published = client.post(
        "/api/v1/admin/solutions",
        headers=headers,
        json={"banner_title": "Live", "section_title": "Shown", "status": "publish"},
    )
    assert draft.status_code == 201
    assert published.status_code == 201

    listed = client.get("/api/v1/public/solutions")
    assert listed.status_code == 200
    titles = [item["banner_title"] for item in listed.json()["items"]]
    assert "Live" in titles
    assert "Hidden" not in titles
    live = next(item for item in listed.json()["items"] if item["banner_title"] == "Live")
    assert live["section_title"] == "Shown"
    assert "status" not in live
    assert "id" not in live
