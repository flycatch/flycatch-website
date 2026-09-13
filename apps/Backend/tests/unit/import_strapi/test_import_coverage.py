from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from flycatch_api.import_strapi.cli import resolve_steps
from flycatch_api.import_strapi.client import StrapiClient
from flycatch_api.import_strapi.context import ImportContext
from flycatch_api.import_strapi.editorial import import_blogs, import_case_studies
from flycatch_api.import_strapi.leads import (
    import_client_testimonials,
    import_downloads,
    import_employee_testimonials,
    import_openings,
)
from flycatch_api.import_strapi.media import MediaImporter
from flycatch_api.import_strapi.pages import (
    import_ai_services,
    import_flycatch_saudi_arabia,
    import_solution_details,
    import_solution_products,
)
from flycatch_api.import_strapi.populate import IMPORT_ORDER, STEP_COLLECTIONS
from flycatch_api.import_strapi.status import IdMap, editorial_author_name, ensure_slug, map_seo
from flycatch_api.import_strapi.taxonomies import import_categories, unique_slug
from flycatch_api.models.author import Author
from flycatch_api.models.blog import Blog
from flycatch_api.models.case_study import CaseStudy
from flycatch_api.models.catalog import Download, EmployeeTestimonial, FlycatchSaudiArabia, Opening
from flycatch_api.models.client_testimonial import ClientTestimonial
from flycatch_api.models.solution_detail import SolutionDetail
from flycatch_api.models.solution_product import SolutionProduct

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "strapi"


class FakeUploader:
    def __init__(self) -> None:
        self.calls: list[tuple[str | None, str | None, int]] = []

    def upload(self, filename: str | None, content_type: str | None, data: bytes):
        from types import SimpleNamespace

        self.calls.append((filename, content_type, len(data)))
        return SimpleNamespace(key=f"uploaded-{len(self.calls)}.bin")


def _client_for(routes: dict) -> StrapiClient:
    def handler(request: httpx.Request) -> httpx.Response:
        collection = request.url.path.strip("/")
        if collection.startswith("api/"):
            collection = collection[4:]
        if collection in routes:
            return httpx.Response(200, json=routes[collection])
        return httpx.Response(404, json={"error": f"missing {collection}"})

    client = StrapiClient("https://cms.example/api", "token", image_base_url="https://cms.example")
    client._client = httpx.Client(
        base_url="https://cms.example/api/", transport=httpx.MockTransport(handler)
    )
    client.download_bytes = lambda url: (b"\x89PNG\r\n\x1a\nfake", "image/png")  # type: ignore[method-assign]
    return client


def _ctx(db, routes: dict, *, dry_run: bool = False) -> tuple[StrapiClient, ImportContext]:
    client = _client_for(routes)
    media = MediaImporter(client, dry_run=dry_run, uploader=FakeUploader())
    return client, ImportContext(db=db, client=client, media=media, dry_run=dry_run)


def test_configured_steps_exclude_missing_subscriptions():
    assert "subscriptions" not in IMPORT_ORDER
    assert "subscriptions" not in STEP_COLLECTIONS
    assert "homepages" in STEP_COLLECTIONS["homes"]
    assert "products" in STEP_COLLECTIONS["solution-products"]
    assert "data-and-analytics" in STEP_COLLECTIONS["data-analytics"]
    assert "dev-ops-consultations" in STEP_COLLECTIONS["devops-consult"]
    assert "infrastructure-management-and-automations" in STEP_COLLECTIONS[
        "infrastructure-management"
    ]
    assert "application-development-services" in STEP_COLLECTIONS["application-development"]


def test_resolve_steps_filters_and_rejects_unknown():
    assert resolve_steps("") == list(IMPORT_ORDER)
    assert resolve_steps("blogs,categories") == ["categories", "blogs"]
    with pytest.raises(ValueError, match="Unknown"):
        resolve_steps("not-a-step")


def test_ensure_slug_preserves_mixed_case():
    assert ensure_slug("flyGrid-ai", "fallback") == "flyGrid-ai"


def test_map_seo_uses_flat_blog_fields():
    seo = map_seo(
        None,
        fallback={
            "title": "Data Governance",
            "description": "Measurable value",
            "canonical_url": "https://example.com/post",
            "image_alt": "Chart",
        },
    )
    assert seo["title"] == "Data Governance"
    assert seo["description"] == "Measurable value"
    assert seo["canonical_url"] == "https://example.com/post"
    assert seo["image_alt"] == "Chart"


def test_editorial_author_name_ignores_email():
    name = editorial_author_name(
        {},
        {"username": "Muneer", "email": "muneer@flycatchtech.com"},
    )
    assert name == "Muneer"
    assert "@" not in name
    assert editorial_author_name({}, {"email": "muneer@flycatchtech.com"}) == ""


def test_import_blog_seo_and_no_staff_email(db):
    routes = {
        "categories": json.loads((FIXTURES / "categories.json").read_text()),
        "blogs": json.loads((FIXTURES / "blogs.json").read_text()),
    }
    client, ctx = _ctx(db, routes)
    try:
        import_categories(ctx)
        import_blogs(ctx)
        db.commit()
        blog = db.query(Blog).one()
        assert blog.seo["title"] == "Hello World"
        assert blog.seo["description"] == "A sample blog"
        assert blog.seo["canonical_url"].endswith("/hello-world")
        assert blog.seo["image_alt"] == "Hero"
        author = db.query(Author).one()
        assert author.name == "alice"
        assert "example.com" not in json.dumps(author.name)
        assert "@" not in author.name
    finally:
        client.close()


def test_import_preserves_mixed_case_slug_and_reports_collision(db):
    payload = json.loads((FIXTURES / "blogs.json").read_text())
    first = payload["data"][0]
    first["attributes"]["slug"] = "flyGrid-ai"
    second = json.loads(json.dumps(first))
    second["id"] = 99
    payload["data"] = [first, second]
    client, ctx = _ctx(db, {"blogs": payload, "categories": {"data": [], "meta": {}}})
    try:
        import_blogs(ctx)
        db.commit()
        assert db.query(Blog).count() == 1
        assert db.query(Blog).one().slug == "flyGrid-ai"
        assert any("collision" in err for err in ctx.stats.errors)
    finally:
        client.close()


def test_unique_slug_does_not_suffix(db):
    from datetime import UTC, datetime

    from flycatch_api.models.blog import BlogStatus

    db.add(
        Blog(
            title="One",
            slug="shared",
            description="",
            body="",
            status=BlogStatus.draft,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
    )
    db.flush()
    from flycatch_api.import_strapi.status import SlugCollisionError

    with pytest.raises(SlugCollisionError):
        unique_slug(db, Blog, "shared")


def test_import_case_study_and_product_seo(db):
    routes = {
        "case-studies": json.loads((FIXTURES / "case_studies.json").read_text()),
        "products": json.loads((FIXTURES / "products.json").read_text()),
    }
    client, ctx = _ctx(db, routes)
    try:
        import_case_studies(ctx)
        import_solution_products(ctx)
        db.commit()
        case = db.query(CaseStudy).one()
        assert case.slug == "a-Social-Case"
        assert case.seo["title"] == "Retail SEO title"
        assert case.seo["description"] == "Retail SEO description"
        assert case.seo["canonical_url"].endswith("/a-Social-Case")
        assert case.seo["image_alt"] == "Case hero"
        product = db.query(SolutionProduct).one()
        assert product.slug == "flyGrid-ai"
        assert product.seo["title"] == "FlyGrid SEO"
        assert product.seo["canonical_url"].endswith("/flyGrid-ai")
        assert product.seo["image_alt"] == "FlyGrid mark"
    finally:
        client.close()


def test_import_ai_service_solution_links(db):
    routes = {
        "solution-details": json.loads((FIXTURES / "solution_details.json").read_text()),
        "ai-services": json.loads((FIXTURES / "ai_services.json").read_text()),
    }
    client, ctx = _ctx(db, routes)
    try:
        import_solution_details(ctx)
        import_ai_services(ctx)
        db.commit()
        detail = db.query(SolutionDetail).one()
        assert detail.slug == "flyGrid-ai"
        from flycatch_api.models.ai_service import AiService

        service = db.query(AiService).one()
        assert len(service.solution_links) == 1
        assert service.solution_links[0].solution_detail_id == detail.id
    finally:
        client.close()


def test_import_saudi_banner_image(db):
    routes = {"flycatch-saudi-arabias": json.loads((FIXTURES / "saudi.json").read_text())}
    client, ctx = _ctx(db, routes)
    try:
        import_flycatch_saudi_arabia(ctx)
        db.commit()
        row = db.query(FlycatchSaudiArabia).one()
        assert row.banner_image_key == "uploaded-1.bin"
        assert row.banner_title == "Saudi banner"
    finally:
        client.close()


def test_bare_array_collections_import(db):
    routes = {
        "client-testimonials": json.loads((FIXTURES / "client_testimonials.json").read_text()),
        "employee-testimonials": json.loads((FIXTURES / "employee_testimonials.json").read_text()),
        "downloads": json.loads((FIXTURES / "downloads.json").read_text()),
        "openings": json.loads((FIXTURES / "openings.json").read_text()),
    }
    client, ctx = _ctx(db, routes)
    try:
        import_client_testimonials(ctx)
        import_employee_testimonials(ctx)
        import_downloads(ctx)
        import_openings(ctx)
        db.commit()
        assert db.query(ClientTestimonial).count() == 1
        assert db.query(EmployeeTestimonial).count() == 1
        assert db.query(Download).one().file_key == "uploaded-1.bin"
        assert db.query(Opening).one().slug == "it-recruiter"
        assert not ctx.stats.errors
    finally:
        client.close()


def test_rehearsal_mode_writes_nothing(db):
    routes = {
        "blogs": json.loads((FIXTURES / "blogs.json").read_text()),
        "categories": {"data": []},
    }
    client, ctx = _ctx(db, routes, dry_run=True)
    try:
        import_blogs(ctx)
        db.commit()
        assert ctx.stats.created == 1
        assert db.query(Blog).count() == 0
    finally:
        client.close()


def test_id_map_persists_round_trip():
    mapping = IdMap()
    from uuid import uuid4

    local = uuid4()
    mapping.set("blogs", 7, local)
    restored = IdMap()
    restored.load_dict(mapping.to_dict())
    assert restored.get("blogs", 7) == local
    assert restored.owner("blogs", local) == 7


def test_media_failure_is_recorded_and_import_continues(db):
    routes = {
        "blogs": json.loads((FIXTURES / "blogs.json").read_text()),
        "categories": {"data": []},
    }
    client, ctx = _ctx(db, routes)

    def boom(url: str):
        raise RuntimeError("unreachable asset")

    client.download_bytes = boom  # type: ignore[method-assign]
    try:
        import_blogs(ctx)
        db.commit()
        blog = db.query(Blog).one()
        assert blog.image_key is None
        assert ctx.media.errors
        assert "unreachable asset" in ctx.media.errors[0]
    finally:
        client.close()


def test_publication_state_default_is_live():
    client = StrapiClient("https://cms.example/api", "token")
    assert client.publication_state == "live"
    client.close()
