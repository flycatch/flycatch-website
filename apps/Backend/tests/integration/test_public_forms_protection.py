from io import BytesIO

from flycatch_api.api import admin_media
from flycatch_api.models.catalog import Contact, DownloadRequest
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


def test_honeypot_rejects_bot_and_contact_variants(client, db):
    partnership = client.post(
        "/api/v1/public/contacts",
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "phone": "555-0100",
            "contact_type": "PARTNERSHIP",
            "company_name": "Analytical Engines",
            "details": "Joint delivery",
        },
    )
    assert partnership.status_code == 201, partnership.text

    missing_quote = client.post(
        "/api/v1/public/contacts",
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada2@example.com",
            "phone": "555-0100",
            "contact_type": "GET_A_QUOTE",
        },
    )
    assert missing_quote.status_code == 422

    before = db.query(Contact).count()
    bot = client.post(
        "/api/v1/public/contacts",
        json={
            "name": "Spam",
            "last_name": "Bot",
            "email": "bot@example.com",
            "phone": "555-0100",
            "contact_type": "GENERAL_ENQUIRY",
            "subject": "Hi",
            "website": "https://spam.example",
        },
    )
    assert bot.status_code == 422
    db.expire_all()
    assert db.query(Contact).count() == before


def test_honeypot_rejects_newsletter_and_download(client, db, bootstrapped):
    headers = _admin(client, bootstrapped)
    download = client.post(
        "/api/v1/admin/downloads",
        headers=headers,
        json={"name": "Pack", "file_key": "pack.pdf", "status": "publish"},
    )
    bot_download = client.post(
        f"/api/v1/public/downloads/{download.json()['id']}/requests",
        json={"name": "Bot", "email": "bot@example.com", "website": "filled"},
    )
    assert bot_download.status_code == 422
    assert db.query(DownloadRequest).count() == 0

    bot_news = client.post(
        "/api/v1/public/newsletter/signup",
        json={"email": "bot@example.com", "website": "filled"},
    )
    assert bot_news.status_code == 422


def test_honeypot_rejects_application(client, monkeypatch):
    media = MediaService(storage=MemoryStorage())
    monkeypatch.setattr(catalog_service, "application_media", media)
    monkeypatch.setattr(admin_media, "_media", media)
    created = client.post(
        "/api/v1/public/applications",
        data={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "phone": "555-0100",
            "website": "https://spam.example",
        },
        files={"resume": ("resume.pdf", BytesIO(b"%PDF-1.4 mock"), "application/pdf")},
    )
    assert created.status_code == 422
