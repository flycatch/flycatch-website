from flycatch_api.models import ManagedRecord, RecordType


def _bearer(client, email, password):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": email, "password": password},
    ).json()
    return tokens, {"Authorization": f"Bearer {tokens['access_token']}"}


def test_editor_can_draft_but_direct_publish_is_403(client, bootstrapped, seeded_records, db):
    tokens, headers = _bearer(client, bootstrapped["editor_email"], bootstrapped["editor_password"])
    page = client.get("/api/v1/admin/pages/home", headers=headers)
    assert page.status_code == 200
    draft = client.patch("/api/v1/admin/pages/home", headers=headers, json=page.json()["draft"])
    assert draft.status_code == 200

    before = (
        db.query(ManagedRecord)
        .filter(ManagedRecord.type == RecordType.page, ManagedRecord.slug == "home")
        .one()
        .published_at
    )
    denied = client.post(
        "/api/v1/admin/publish",
        headers=headers,
        json={"type": "page", "slug": "home"},
    )
    assert denied.status_code == 403
    body = denied.json()
    assert body["code"] == "permission_denied"
    assert body["message_key"] == "admin.action.forbidden"
    assert body["permission"] == "page.home.publish"
    after = (
        db.query(ManagedRecord)
        .filter(ManagedRecord.type == RecordType.page, ManagedRecord.slug == "home")
        .one()
        .published_at
    )
    assert after == before

    still_signed_in = client.get("/api/v1/admin/auth/session", headers=headers)
    assert still_signed_in.status_code == 200
    assert still_signed_in.json()["email"] == bootstrapped["editor_email"]


def test_unauthenticated_publish_is_401_not_403(client, seeded_records):
    response = client.post("/api/v1/admin/publish", json={"type": "page", "slug": "home"})
    assert response.status_code == 401
    body = response.json()
    assert body["code"] == "unauthenticated"
    assert "roles" not in body
    assert "permissions" not in body
    assert "email" not in body
