from io import BytesIO

from fastapi.testclient import TestClient

from flycatch_api.api import admin_media, public_media
from flycatch_api.services.media_service import MediaService


class MemoryStorage:
    def __init__(self) -> None:
        self.items: dict[str, tuple[bytes, str]] = {}

    def put_bytes(self, key: str, body: bytes, content_type: str) -> None:
        self.items[key] = (body, content_type)

    def get_bytes(self, key: str) -> tuple[bytes, str] | None:
        return self.items.get(key)


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_unauthenticated_homes_are_rejected(client):
    response = client.get("/api/v1/admin/homes")
    assert response.status_code == 401


def test_home_crud_search_pagination_and_publish(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/homes",
        headers=headers,
        json={"title": "Hero block", "banner_title": "Welcome"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "draft"
    assert body["content_available_in"] == ["en"]
    assert body["seo"]["title"] == ""
    home_id = body["id"]

    listed = client.get("/api/v1/admin/homes", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["content_available_in"] == "En"
    assert listed.json()["items"][0]["state"] == "draft"
    assert listed.json()["items"][0]["video_format"] == ""

    published = client.patch(
        f"/api/v1/admin/homes/{home_id}",
        headers=headers,
        json={
            "title": "Hero block",
            "banner_title": "Welcome",
            "status": "publish",
            "seo": {"title": "Home SEO", "description": "Desc", "canonical_url": "/", "meta_title": "Meta"},
        },
    )
    assert published.status_code == 200
    assert published.json()["status"] == "publish"
    assert published.json()["seo"]["title"] == "Home SEO"

    unpublished = client.patch(
        f"/api/v1/admin/homes/{home_id}",
        headers=headers,
        json={"title": "Hero block", "status": "draft"},
    )
    assert unpublished.json()["status"] == "draft"

    search = client.get("/api/v1/admin/homes?q=Hero", headers=headers)
    assert search.json()["total"] == 1

    for index in range(10):
        extra = client.post(
            "/api/v1/admin/homes",
            headers=headers,
            json={"title": f"Home {index}"},
        )
        assert extra.status_code == 201
    page_two = client.get("/api/v1/admin/homes?page=2", headers=headers)
    assert page_two.status_code == 200
    assert page_two.json()["total"] == 11
    assert len(page_two.json()["items"]) == 1

    deleted = client.delete(f"/api/v1/admin/homes/{home_id}", headers=headers)
    assert deleted.status_code == 204


def test_home_rejects_blank_title(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    response = client.post("/api/v1/admin/homes", headers=headers, json={"title": "   "})
    assert response.status_code == 422


def test_home_assigns_case_studies(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    study = client.post(
        "/api/v1/admin/case-studies",
        headers=headers,
        json={"heading": "Retail win", "slug": "retail-win", "status": "publish"},
    )
    assert study.status_code == 201
    study_id = study.json()["id"]
    created = client.post(
        "/api/v1/admin/homes",
        headers=headers,
        json={"title": "With studies", "case_study_ids": [study_id], "status": "publish"},
    )
    assert created.status_code == 201
    assert created.json()["case_study_ids"] == [study_id]


def test_home_repeatable_services_and_faqs(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/homes",
        headers=headers,
        json={
            "title": "Repeatable",
            "status": "publish",
            "services": [
                {
                    "services_types_title": "AI",
                    "services_image_key": None,
                    "services_contents": "Build AI products",
                    "our_services_links": "/ai",
                },
                {
                    "services_types_title": "Web",
                    "services_image_key": None,
                    "services_contents": "Build web apps",
                    "our_services_links": "/web",
                },
            ],
            "faqs": [
                {"title": "What is Flycatch?", "contents": "A delivery partner"},
                {"title": "Where do we work?", "contents": "Across industries"},
            ],
        },
    )
    assert created.status_code == 201
    body = created.json()
    assert [item["services_types_title"] for item in body["services"]] == ["AI", "Web"]
    assert [item["title"] for item in body["faqs"]] == ["What is Flycatch?", "Where do we work?"]
    listed = client.get("/api/v1/public/homes")
    home = next(item for item in listed.json()["items"] if item["title"] == "Repeatable")
    assert home["services"][1]["our_services_links"] == "/web"
    assert home["faqs"][0]["contents"] == "A delivery partner"


def test_video_upload_and_public_media(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    storage = MemoryStorage()
    service = MediaService(storage=storage)
    admin_media._media = service
    public_media._media = service
    upload = client.post(
        "/api/v1/admin/media",
        headers=headers,
        files={"file": ("clip.mp4", BytesIO(b"\x00\x00\x00 ftyp"), "video/mp4")},
    )
    assert upload.status_code == 201
    key = upload.json()["key"]
    assert key.endswith(".mp4")
    created = client.post(
        "/api/v1/admin/homes",
        headers=headers,
        json={"title": "Video home", "video_key": key, "video_content_type": "video/mp4"},
    )
    assert created.json()["video_key"] == key
    listed = client.get("/api/v1/admin/homes", headers=headers)
    assert listed.json()["items"][0]["video_format"] == "mp4"
    public = client.get(f"/api/v1/public/media/{key}")
    assert public.status_code == 200
    assert public.content.startswith(b"\x00\x00")
