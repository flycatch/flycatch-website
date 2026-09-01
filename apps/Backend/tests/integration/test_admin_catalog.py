from io import BytesIO

from fastapi.testclient import TestClient

from flycatch_api.api import admin_media
from flycatch_api.services.media_service import DOCUMENT_MAX_BYTES, MediaService


class MemoryStorage:
    def __init__(self) -> None:
        self.items: dict[str, tuple[bytes, str]] = {}

    def put_bytes(self, key: str, body: bytes, content_type: str) -> None:
        self.items[key] = (body, content_type)

    def get_bytes(self, key: str) -> tuple[bytes, str] | None:
        return self.items.get(key)


def _admin(client: TestClient, bootstrapped):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_catalog_is_rejected(client):
    assert client.get("/api/v1/admin/applications").status_code == 401
    assert client.get("/api/v1/admin/openings").status_code == 401
    assert client.get("/api/v1/admin/news").status_code == 401


def test_application_opening_and_public_nested(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/applications",
        headers=headers,
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "phone": "123",
            "current_ctc": 10,
            "expected_ctc": 12,
            "notice_period": 30,
            "experience": 5,
            "resume_key": "cv.pdf",
            "status": "publish",
        },
    )
    assert created.status_code == 201, created.text
    app_id = created.json()["id"]
    assert created.json()["resume_format"] == "PDF"
    listed = client.get("/api/v1/admin/applications", headers=headers)
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["resume_format"] == "PDF"

    photo = client.post(
        "/api/v1/admin/applications",
        headers=headers,
        json={
            "name": "Grace",
            "last_name": "Hopper",
            "email": "grace@example.com",
            "resume_key": "resume.jpeg",
            "status": "draft",
        },
    )
    assert photo.status_code == 201, photo.text
    assert photo.json()["resume_format"] == "JPG"

    opening = client.post(
        "/api/v1/admin/openings",
        headers=headers,
        json={
            "job_id": "JOB-1",
            "role": "Backend Engineer",
            "location": "Kochi",
            "job_type": "Full-Time",
            "job_status": "Ongoing",
            "specialization": "Backend",
            "application_ids": [app_id],
            "status": "publish",
        },
    )
    assert opening.status_code == 201, opening.text
    assert opening.json()["slug"] == "backend-engineer"
    assert opening.json()["applications"][0]["email"] == "ada@example.com"

    public = client.get("/api/v1/public/openings/backend-engineer")
    assert public.status_code == 200
    assert public.json()["applications"][0]["name"] == "Ada"
    assert "status" not in public.json()

    public_apps = client.get("/api/v1/public/applications")
    assert public_apps.status_code == 200
    assert public_apps.json()["items"][0]["email"] == "ada@example.com"

    negative = client.post(
        "/api/v1/admin/applications",
        headers=headers,
        json={"name": "Pat", "last_name": "Lee", "email": "pat@example.com", "current_ctc": -1},
    )
    assert negative.status_code == 422


def test_named_categories_email_memberships_and_news(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    category = client.post(
        "/api/v1/admin/news-categories",
        headers=headers,
        json={"name": "Company", "status": "publish"},
    )
    assert category.status_code == 201
    cat_id = category.json()["id"]

    authors = client.get("/api/v1/admin/authors", headers=headers)
    author_id = None
    if authors.status_code == 200 and authors.json().get("items"):
        author_id = authors.json()["items"][0]["id"]
    else:
        created_author = client.post(
            "/api/v1/admin/authors",
            headers=headers,
            json={"name": "News Writer", "status": "publish"},
        )
        assert created_author.status_code == 201, created_author.text
        author_id = created_author.json()["id"]

    news = client.post(
        "/api/v1/admin/news",
        headers=headers,
        json={
            "title": "Launch Day",
            "body": "<p>Hello</p>",
            "news_category_ids": [cat_id],
            "author_ids": [author_id],
            "reading_time": 3,
            "status": "publish",
        },
    )
    assert news.status_code == 201, news.text
    listed = client.get("/api/v1/admin/news", headers=headers)
    assert listed.json()["items"][0]["news_categories"] == 1
    assert listed.json()["items"][0]["news_category_names"] == ["Company"]

    public_news = client.get("/api/v1/public/news/launch-day")
    assert public_news.status_code == 200
    assert public_news.json()["news_categories"][0]["name"] == "Company"
    assert public_news.json()["authors"][0]["name"] == "News Writer"

    resource_cat = client.post(
        "/api/v1/admin/resource-categories",
        headers=headers,
        json={"name": "Whitepapers", "status": "publish"},
    )
    resource = client.post(
        "/api/v1/admin/resources",
        headers=headers,
        json={
            "title": "Guide",
            "resource_category_ids": [resource_cat.json()["id"]],
            "pdf_key": "file.pdf",
            "status": "publish",
        },
    )
    assert resource.status_code == 201, resource.text
    assert client.get("/api/v1/public/resources/guide").status_code == 200

    email_cfg = client.post(
        "/api/v1/admin/email-configuration",
        headers=headers,
        json={
            "smtp_default_from": "from@example.com",
            "smtp_default_reply_to": "reply@example.com",
            "smtp_admin_email": "admin@example.com",
            "status": "publish",
        },
    )
    assert email_cfg.status_code == 201, email_cfg.text
    template = client.post(
        "/api/v1/admin/email-templates",
        headers=headers,
        json={
            "slug": "welcome",
            "type": "user_notification",
            "subject": "Hello",
            "body": "<p>Hi</p>",
            "status": "publish",
        },
    )
    assert template.status_code == 201, template.text
    assert client.get("/api/v1/public/email-templates/welcome").json()["subject"] == "Hello"

    testimonial = client.post(
        "/api/v1/admin/employee-testimonials",
        headers=headers,
        json={"name": "Sam", "review": "Great place", "order": 1, "listed": True, "status": "publish"},
    )
    assert testimonial.status_code == 201
    membership = client.post(
        "/api/v1/admin/memberships",
        headers=headers,
        json={
            "title": "Nasscom",
            "description": "Member",
            "images": [{"image_key": "logo.png", "alt": "logo"}],
            "status": "publish",
        },
    )
    assert membership.status_code == 201, membership.text
    listed_m = client.get("/api/v1/admin/memberships", headers=headers)
    assert listed_m.json()["items"][0]["images"] == 1

    draft_news = client.post(
        "/api/v1/admin/news",
        headers=headers,
        json={"title": "Secret Draft"},
    )
    assert draft_news.status_code == 201
    public_list = client.get("/api/v1/public/news")
    slugs = [item["slug"] for item in public_list.json()["items"]]
    assert "secret-draft" not in slugs


def test_document_upload_accepts_pdf_and_rejects_oversize(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    storage = MemoryStorage()
    admin_media._media = MediaService(storage=storage)
    upload = client.post(
        "/api/v1/admin/media",
        headers=headers,
        files={"file": ("resume.pdf", BytesIO(b"%PDF-1.4 mock"), "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    assert upload.json()["key"].endswith(".pdf")
    too_large = client.post(
        "/api/v1/admin/media",
        headers=headers,
        files={
            "file": (
                "huge.pdf",
                BytesIO(b"x" * (DOCUMENT_MAX_BYTES + 1)),
                "application/pdf",
            )
        },
    )
    assert too_large.status_code == 422
