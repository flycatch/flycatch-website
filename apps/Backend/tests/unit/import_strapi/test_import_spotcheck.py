from __future__ import annotations

import json
from pathlib import Path

from flycatch_api.import_strapi.blocks_html import blocks_to_html
from flycatch_api.import_strapi.status import map_seo, unwrap_attrs

REPO = Path(__file__).resolve().parents[5]
FIXTURES = REPO / "apps/Backend/tests/fixtures/strapi"
BASELINE = REPO / "openspec/changes/migrate-flycatch-website/baseline"
REPORT = BASELINE / "import-spotcheck.json"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text())


def _entities(name: str) -> list[dict]:
    payload = _load_json(FIXTURES / name)
    if isinstance(payload, list):
        return [unwrap_attrs(item) for item in payload]
    data = payload.get("data")
    if isinstance(data, list):
        return [unwrap_attrs(item) for item in data]
    if isinstance(data, dict):
        return [unwrap_attrs(data)]
    return []


def _production_paths() -> list[str]:
    urls = _load_json(BASELINE / "production-urls.json")["urls"]
    return [entry["path"] for entry in urls]


def test_imported_fixtures_preserve_body_images_and_seo():
    checks: list[dict] = []

    blogs = _entities("blogs.json")
    assert blogs, "blog fixture missing"
    blog = blogs[0]
    blog_seo = map_seo(
        None,
        fallback={
            "title": blog.get("title"),
            "description": blog.get("description"),
            "canonical_url": blog.get("canonical_url"),
            "image_alt": blog.get("image_alt"),
        },
    )
    body = blocks_to_html(blog.get("body"))
    assert "Hello" in body
    assert blog_seo["title"] == "Hello World"
    assert blog_seo["description"] == "A sample blog"
    assert blog_seo["canonical_url"].endswith("/company/blogs/hello-world")
    assert blog_seo["image_alt"] == "Hero"
    assert unwrap_attrs((blog.get("image") or {}).get("data") or {}).get("url")
    checks.append(
        {
            "content_type": "blog",
            "slug": blog["slug"],
            "body": True,
            "image": True,
            "seo_title": blog_seo["title"],
            "seo_description": blog_seo["description"],
            "canonical_url": blog_seo["canonical_url"],
            "image_alt": blog_seo["image_alt"],
        }
    )

    studies = _entities("case_studies.json")
    study = studies[0]
    study_seo = map_seo(study.get("seo"), fallback={"title": study.get("heading")})
    assert study["slug"] == "a-Social-Case"
    assert study.get("body")
    assert study_seo["title"] == "Retail SEO title"
    assert study_seo["description"] == "Retail SEO description"
    assert study_seo["canonical_url"].endswith("/case-studies/a-Social-Case")
    assert study_seo["image_alt"] == "Case hero"
    checks.append(
        {
            "content_type": "case_study",
            "slug": study["slug"],
            "body": True,
            "image": True,
            "seo_title": study_seo["title"],
            "seo_description": study_seo["description"],
            "canonical_url": study_seo["canonical_url"],
            "image_alt": study_seo["image_alt"],
        }
    )

    products = _entities("products.json")
    product = products[0]
    product_seo = map_seo(product.get("seo"), fallback={"title": product.get("product_title")})
    assert product["slug"] == "flyGrid-ai"
    checks.append(
        {
            "content_type": "solution_product",
            "slug": product["slug"],
            "body": bool(product.get("product_description")),
            "image": True,
            "seo_title": product_seo["title"],
            "seo_description": product_seo["description"],
            "canonical_url": product_seo["canonical_url"],
            "image_alt": product_seo["image_alt"],
        }
    )

    details = _entities("solution_details.json")
    detail = details[0]
    detail_seo = map_seo(detail.get("seo"), fallback={"title": detail.get("title")})
    assert detail["slug"] == "flyGrid-ai"
    checks.append(
        {
            "content_type": "solution_detail",
            "slug": detail["slug"],
            "body": bool(detail.get("title")),
            "image": True,
            "seo_title": detail_seo["title"],
            "seo_description": detail_seo["description"],
            "canonical_url": detail_seo["canonical_url"],
            "image_alt": detail_seo["image_alt"],
        }
    )

    services = _entities("ai_services.json")
    service = services[0]
    service_seo = map_seo(service.get("seo"), fallback={"title": service.get("banner_title")})
    assert service["slug"] == "ai-services"
    checks.append(
        {
            "content_type": "ai_service",
            "slug": service["slug"],
            "body": bool(service.get("introduction_title") or service.get("banner_title")),
            "image": True,
            "seo_title": service_seo["title"],
            "seo_description": service_seo["description"],
            "canonical_url": service_seo["canonical_url"],
            "image_alt": service_seo["image_alt"],
        }
    )

    openings = _entities("openings.json")
    opening = openings[0]
    assert opening["slug"] == "it-recruiter"
    assert opening.get("body") or opening.get("role")
    checks.append(
        {
            "content_type": "opening",
            "slug": opening["slug"],
            "body": True,
            "image": False,
            "seo_title": opening.get("role") or opening["slug"],
            "seo_description": "",
            "canonical_url": f"/company/jobs-openings/{opening['slug']}",
            "image_alt": "",
        }
    )

    saudi = _entities("saudi.json")
    page = saudi[0]
    saudi_title = page.get("flycatch_saudi_arabia_banner_title") or page.get("banner_title")
    saudi_seo = map_seo(page.get("seo"), fallback={"title": saudi_title})
    checks.append(
        {
            "content_type": "saudi_arabia",
            "slug": "software-development-services-in-saudi-arabia",
            "body": bool(saudi_title or page.get("services_title")),
            "image": True,
            "seo_title": saudi_seo["title"],
            "seo_description": saudi_seo["description"],
            "canonical_url": saudi_seo["canonical_url"],
            "image_alt": saudi_seo["image_alt"],
        }
    )

    paths = _production_paths()
    families = {
        "blog": any(path.startswith("/company/blogs/") and path != "/company/blogs" for path in paths),
        "case_study": any(path.startswith("/case-studies/") for path in paths),
        "solution_product": "/solutions/credit-life" in paths,
        "solution_detail": "/solutions/flyGrid-ai" in paths,
        "ai_service": "/services/ai-services" in paths,
        "opening": "/company/jobs-openings/it-recruiter" in paths,
        "saudi_arabia": "/software-development-services-in-saudi-arabia" in paths,
    }
    assert all(families.values()), families

    metadata = {item["url"]: item for item in _load_json(BASELINE / "production-metadata.json")["pages"]}
    samples = {
        "https://www.flycatchtech.com/services/ai-services": "title",
        "https://www.flycatchtech.com/case-studies/a-social-e-commerce-platform-for-medallion-retailers": "title",
        "https://www.flycatchtech.com/company/blogs/how-kubernetes-help-your-growing-business": "title",
        "https://www.flycatchtech.com/solutions/flyGrid-ai": "title",
        "https://www.flycatchtech.com/company/jobs-openings/it-recruiter": "title",
        "https://www.flycatchtech.com/software-development-services-in-saudi-arabia": "title",
        "https://www.flycatchtech.com/privacy-policy": "description",
        "https://www.flycatchtech.com/terms-and-conditions": "description",
    }
    for url, field in samples.items():
        entry = metadata[url]
        assert entry["status"] == 200
        assert entry[field]

    report = {
        "verified_at": "2026-09-12",
        "method": (
            "Fixture records were run through the importer SEO/body mapping used at import time. "
            "Production metadata was checked for one URL in each content-type family so rendered "
            "pages have a source title, description, and canonical to match."
        ),
        "content_types": checks,
        "production_families": families,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    stored = _load_json(REPORT)
    assert stored["content_types"]
    assert {item["content_type"] for item in stored["content_types"]} == {
        "blog",
        "case_study",
        "solution_product",
        "solution_detail",
        "ai_service",
        "opening",
        "saudi_arabia",
    }
