from io import BytesIO
from uuid import UUID

from flycatch_api.api import admin_media
from flycatch_api.models.catalog import Application
from flycatch_api.services import catalog_service
from flycatch_api.services.media_service import MediaService


class MemoryStorage:
    def __init__(self) -> None:
        self.items: dict[str, tuple[bytes, str]] = {}

    def put_bytes(self, key: str, body: bytes, content_type: str) -> None:
        self.items[key] = (body, content_type)

    def get_bytes(self, key: str) -> tuple[bytes, str] | None:
        return self.items.get(key)


def _admin(client, bootstrapped):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_application_stores_resume_for_staff(client, db, bootstrapped, monkeypatch):
    storage = MemoryStorage()
    media = MediaService(storage=storage)
    monkeypatch.setattr(catalog_service, "application_media", media)
    monkeypatch.setattr(admin_media, "_media", media)

    headers = _admin(client, bootstrapped)
    opening = client.post(
        "/api/v1/admin/openings",
        headers=headers,
        json={"job_id": "FC-1", "role": "Engineer", "slug": "engineer", "status": "publish"},
    )
    assert opening.status_code == 201, opening.text

    created = client.post(
        "/api/v1/public/applications",
        data={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "phone": "555-0100",
            "additional_info": "I write compilers.",
            "opening_slug": "engineer",
        },
        files={"resume": ("resume.pdf", BytesIO(b"%PDF-1.4 mock"), "application/pdf")},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["email"] == "ada@example.com"
    assert body["resume_key"]
    assert body["resume_format"] == "PDF"
    assert "engineer" in body["openings"].lower() or body["openings"]

    db.expire_all()
    stored = db.get(Application, UUID(body["id"]))
    assert stored is not None
    assert stored.resume_key == body["resume_key"]
    assert storage.get_bytes(stored.resume_key) is not None

    staff = client.get(f"/api/v1/admin/applications/{body['id']}", headers=headers)
    assert staff.status_code == 200, staff.text
    assert staff.json()["resume_key"] == body["resume_key"]

    media = client.get(f"/api/v1/admin/media/{body['resume_key']}", headers=headers)
    assert media.status_code == 200
    assert media.content == b"%PDF-1.4 mock"

    rejected = client.post(
        "/api/v1/public/applications",
        data={"name": "Ada", "last_name": "Lovelace", "email": "bad", "phone": "1"},
        files={"resume": ("resume.pdf", BytesIO(b"%PDF-1.4 mock"), "application/pdf")},
    )
    assert rejected.status_code == 422

    bad_file = client.post(
        "/api/v1/public/applications",
        data={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada2@example.com",
            "phone": "555-0101",
        },
        files={"resume": ("photo.png", BytesIO(b"not-a-doc"), "image/png")},
    )
    assert bad_file.status_code == 422
