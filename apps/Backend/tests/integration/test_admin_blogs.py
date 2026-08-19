from io import BytesIO

from fastapi.testclient import TestClient

from flycatch_api.api import admin_media
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


def _headers(client, email, password):
    tokens = _sign_in(client, email, password).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _admin(client, bootstrapped):
    return _headers(client, bootstrapped["admin_email"], bootstrapped["admin_password"])


def _editor(client, bootstrapped):
    return _headers(client, bootstrapped["editor_email"], bootstrapped["editor_password"])


def test_unauthenticated_blogs_are_rejected(client):
    response = client.get("/api/v1/admin/blogs")
    assert response.status_code == 401


def test_author_category_and_blog_crud(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    author = client.post(
        "/api/v1/admin/authors",
        headers=headers,
        json={
            "name": "Ada Lovelace",
            "bio": "Mathematician",
            "designation": "Writer",
        },
    )
    assert author.status_code == 201
    author_id = author.json()["id"]
    assert author.json()["name"] == "Ada Lovelace"
    assert author.json()["bio"] == "Mathematician"
    assert author.json()["designation"] == "Writer"
    category = client.post(
        "/api/v1/admin/categories",
        headers=headers,
        json={"name": "Engineering"},
    )
    assert category.status_code == 201
    category_id = category.json()["id"]

    created = client.post(
        "/api/v1/admin/blogs",
        headers=headers,
        json={
            "title": "First Post",
            "slug": "first-post",
            "description": "Intro",
            "body": "<p>Hello</p>",
            "status": "draft",
            "reading_time": 4,
            "author_ids": [author_id],
            "category_ids": [category_id],
        },
    )
    assert created.status_code == 201
    blog = created.json()
    assert blog["slug"] == "first-post"
    assert blog["status"] == "draft"
    assert blog["content_available_in"] == ["en"]
    assert blog["author_ids"] == [author_id]
    assert blog["category_ids"] == [category_id]
    assert blog["authors"][0]["name"] == "Ada Lovelace"
    assert blog["authors"][0]["bio"] == "Mathematician"
    assert blog["authors"][0]["designation"] == "Writer"

    listed = client.get("/api/v1/admin/blogs", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["per_page"] == 10
    assert listed.json()["items"][0]["author"] == "Ada Lovelace"
    assert listed.json()["items"][0]["content_available_in"] == "En"
    assert listed.json()["items"][0]["state"] == "draft"

    updated = client.patch(
        f"/api/v1/admin/blogs/{blog['id']}",
        headers=headers,
        json={
            "title": "First Post",
            "slug": "first-post",
            "status": "publish",
            "author_ids": [author_id],
            "category_ids": [category_id],
        },
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "publish"

    authors = client.get("/api/v1/admin/authors", headers=headers)
    assert any(item["name"] == "Ada Lovelace" for item in authors.json()["items"])
    categories = client.get("/api/v1/admin/categories", headers=headers)
    assert any(item["name"] == "Engineering" for item in categories.json()["items"])

    blocked_author = client.delete(f"/api/v1/admin/authors/{author_id}", headers=headers)
    assert blocked_author.status_code == 409
    assert blocked_author.json()["code"] == "in_use"
    blocked_category = client.delete(f"/api/v1/admin/categories/{category_id}", headers=headers)
    assert blocked_category.status_code == 409

    deleted = client.delete(f"/api/v1/admin/blogs/{blog['id']}", headers=headers)
    assert deleted.status_code == 204
    removed_author = client.delete(f"/api/v1/admin/authors/{author_id}", headers=headers)
    assert removed_author.status_code == 204
    removed_category = client.delete(f"/api/v1/admin/categories/{category_id}", headers=headers)
    assert removed_category.status_code == 204


def test_blog_search_and_pagination(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    author = client.post(
        "/api/v1/admin/authors",
        headers=headers,
        json={"name": "Search Author"},
    )
    author_id = author.json()["id"]
    for index in range(11):
        created = client.post(
            "/api/v1/admin/blogs",
            headers=headers,
            json={
                "title": f"Post {index}",
                "slug": f"post-{index}",
                "status": "draft",
                "author_ids": [author_id] if index == 3 else [],
            },
        )
        assert created.status_code == 201
    page_one = client.get("/api/v1/admin/blogs?page=1&per_page=10", headers=headers)
    assert page_one.status_code == 200
    body = page_one.json()
    assert body["per_page"] == 10
    assert body["total"] >= 11
    assert len(body["items"]) == 10
    page_two = client.get("/api/v1/admin/blogs?page=2&per_page=10", headers=headers)
    assert page_two.status_code == 200
    assert page_two.json()["items"]
    search = client.get("/api/v1/admin/blogs?q=Search Author", headers=headers)
    assert search.status_code == 200
    assert search.json()["total"] == 1
    assert search.json()["items"][0]["slug"] == "post-3"


def test_duplicate_slug_is_rejected(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    first = client.post(
        "/api/v1/admin/blogs",
        headers=headers,
        json={"title": "Same", "slug": "same-slug", "status": "draft"},
    )
    assert first.status_code == 201
    second = client.post(
        "/api/v1/admin/blogs",
        headers=headers,
        json={"title": "Other", "slug": "same-slug", "status": "draft"},
    )
    assert second.status_code == 422
    assert second.json()["detail"]["fields"]["slug"]["message_key"] == "admin.blogs.slug.duplicate"


def test_editor_can_write_blogs(client, bootstrapped):
    headers = _editor(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/blogs",
        headers=headers,
        json={"title": "Editor Post", "slug": "editor-post", "status": "draft"},
    )
    assert created.status_code == 201


def test_media_upload_and_fetch(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    storage = MemoryStorage()
    admin_media._media = MediaService(storage=storage)
    upload = client.post(
        "/api/v1/admin/media",
        headers=headers,
        files={"file": ("photo.png", BytesIO(b"\x89PNG\r\n"), "image/png")},
    )
    assert upload.status_code == 201
    key = upload.json()["key"]
    fetched = client.get(f"/api/v1/admin/media/{key}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.content.startswith(b"\x89PNG")
