from uuid import UUID

from flycatch_api.models.catalog import DownloadRequest


def _admin(client, bootstrapped):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_gated_download_request_returns_file_and_is_recorded(client, db, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/downloads",
        headers=headers,
        json={"name": "Whitepaper", "company": "Flycatch", "file_key": "pack.pdf", "status": "publish"},
    )
    assert created.status_code == 201, created.text
    download_id = created.json()["id"]

    requested = client.post(
        f"/api/v1/public/downloads/{download_id}/requests",
        json={"name": "Ada Lovelace", "email": "ada@example.com", "company": "Analytical"},
    )
    assert requested.status_code == 201, requested.text
    body = requested.json()
    assert body["file_key"] == "pack.pdf"
    assert body["download_id"] == download_id
    assert body["email"] == "ada@example.com"
    db.expire_all()
    stored = db.get(DownloadRequest, UUID(body["id"]))
    assert stored is not None
    assert stored.download_id == UUID(download_id)

    draft = client.post(
        "/api/v1/admin/downloads",
        headers=headers,
        json={"name": "Draft pack", "file_key": "draft.pdf", "status": "draft"},
    )
    hidden = client.post(
        f"/api/v1/public/downloads/{draft.json()['id']}/requests",
        json={"name": "Ada Lovelace", "email": "ada2@example.com"},
    )
    assert hidden.status_code == 404

    invalid = client.post(
        f"/api/v1/public/downloads/{download_id}/requests",
        json={"name": "Ada", "email": "not-an-email"},
    )
    assert invalid.status_code == 422
