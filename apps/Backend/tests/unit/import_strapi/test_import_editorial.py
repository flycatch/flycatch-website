from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest

from flycatch_api.import_strapi.client import StrapiClient
from flycatch_api.import_strapi.context import ImportContext
from flycatch_api.import_strapi.editorial import import_blogs
from flycatch_api.import_strapi.media import MediaImporter
from flycatch_api.import_strapi.pages import import_application_development
from flycatch_api.import_strapi.taxonomies import import_authors_from_blogs, import_categories
from flycatch_api.models.author import Author
from flycatch_api.models.blog import Blog, BlogStatus
from flycatch_api.models.category import Category
from flycatch_api.models.landing_pages import ApplicationDevelopment

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "strapi"


class FakeUploader:
    def __init__(self) -> None:
        self.calls: list[tuple[str | None, str | None, int]] = []

    def upload(self, filename: str | None, content_type: str | None, data: bytes):
        self.calls.append((filename, content_type, len(data)))
        return SimpleNamespace(key=f"uploaded-{len(self.calls)}.bin")


def _client_for(routes: dict[str, dict]) -> StrapiClient:
    def handler(request: httpx.Request) -> httpx.Response:
        collection = request.url.path.strip("/")
        if collection.startswith("api/"):
            collection = collection[4:]
        if collection in routes:
            return httpx.Response(200, json=routes[collection])
        # media downloads
        if collection.startswith("uploads/") or request.url.path.endswith(
            (".png", ".jpg", ".jpeg")
        ):
            return httpx.Response(
                200, content=b"\x89PNG\r\n\x1a\n", headers={"content-type": "image/png"}
            )
        return httpx.Response(404, json={"error": f"missing {collection}"})

    client = StrapiClient("https://cms.example/api", "token", image_base_url="https://cms.example")
    client._client = httpx.Client(
        base_url="https://cms.example/api/", transport=httpx.MockTransport(handler)
    )
    # Patch download_bytes to serve fake image bytes without network
    client.download_bytes = lambda url: (b"\x89PNG\r\n\x1a\nfake", "image/png")  # type: ignore[method-assign]
    return client


@pytest.fixture
def routes():
    return {
        "categories": json.loads((FIXTURES / "categories.json").read_text()),
        "blogs": json.loads((FIXTURES / "blogs.json").read_text()),
        "application-development-services": json.loads(
            (FIXTURES / "application_development.json").read_text()
        ),
    }


def test_import_categories_blogs_authors_idempotent(db, routes):
    client = _client_for(routes)
    try:
        uploader = FakeUploader()
        media = MediaImporter(client, uploader=uploader)
        ctx = ImportContext(db=db, client=client, media=media)

        import_categories(ctx)
        import_authors_from_blogs(ctx)
        import_blogs(ctx)
        db.commit()

        assert db.query(Category).count() == 1
        assert db.query(Author).filter(Author.name == "alice").count() == 1
        blog = db.query(Blog).filter(Blog.slug == "hello-world").one()
        assert blog.title == "Hello World"
        assert blog.status == BlogStatus.publish
        assert "<strong>Hello </strong>" in blog.body
        assert blog.image_key == "uploaded-1.bin"
        assert len(blog.author_links) == 1
        assert len(blog.category_links) == 1

        # Second run updates, no duplicates
        ctx2 = ImportContext(
            db=db, client=client, media=MediaImporter(client, uploader=FakeUploader())
        )
        import_categories(ctx2)
        import_authors_from_blogs(ctx2)
        import_blogs(ctx2)
        db.commit()

        assert db.query(Category).count() == 1
        assert db.query(Author).count() == 1
        assert db.query(Blog).count() == 1
        assert ctx2.stats.created == 0
        assert ctx2.stats.updated >= 1
    finally:
        client.close()


def test_import_application_development_landing(db, routes):
    client = _client_for(routes)
    try:
        media = MediaImporter(client, uploader=FakeUploader())
        ctx = ImportContext(db=db, client=client, media=media)
        import_application_development(ctx)
        db.commit()

        row = db.query(ApplicationDevelopment).one()
        assert row.slug == "application-development"
        assert row.banner_title == "Application Development"
        assert row.banner_image_key == "uploaded-1.bin"
        assert row.accordion[0]["title"] == "Discovery"
        assert "Discover needs" in row.accordion[0]["contents"]
        assert row.seo["title"] == "App Dev"
    finally:
        client.close()
