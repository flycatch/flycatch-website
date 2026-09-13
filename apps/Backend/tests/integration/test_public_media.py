from io import BytesIO

from flycatch_api.api import admin_media, public_media
from flycatch_api.api.public_media import MEDIA_CACHE_CONTROL, media_etag
from flycatch_api.services.media_service import MediaService


class MemoryStorage:
    def __init__(self) -> None:
        self.items: dict[str, tuple[bytes, str]] = {}

    def put_bytes(self, key: str, body: bytes, content_type: str) -> None:
        self.items[key] = (body, content_type)

    def get_bytes(self, key: str) -> tuple[bytes, str] | None:
        return self.items.get(key)


def _sign_in(client, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_public_media_supports_head_cache_headers_and_etag_revalidation(client, bootstrapped):
    storage = MemoryStorage()
    service = MediaService(storage=storage)
    admin_media._media = service
    public_media._media = service
    headers = _admin(client, bootstrapped)
    payload = b"media-bytes"
    upload = client.post(
        "/api/v1/admin/media",
        headers=headers,
        files={"file": ("logo.png", BytesIO(payload), "image/png")},
    )
    assert upload.status_code == 201
    key = upload.json()["key"]
    path = f"/api/v1/public/media/{key}"

    head = client.head(path)
    assert head.status_code == 200
    assert head.content == b""
    assert head.headers["cache-control"] == MEDIA_CACHE_CONTROL
    assert head.headers["etag"] == media_etag(payload)

    first = client.get(path)
    assert first.status_code == 200
    assert first.content == payload
    assert first.headers["cache-control"] == MEDIA_CACHE_CONTROL
    assert first.headers["etag"] == media_etag(payload)

    cached = client.get(path, headers={"If-None-Match": first.headers["etag"]})
    assert cached.status_code == 304
    assert cached.headers["etag"] == first.headers["etag"]
